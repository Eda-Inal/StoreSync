import { Injectable, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException, ConflictException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateOrdersDto } from "./dtos/create-orders.dto";
import { ResponseOrdersDto } from "./dtos/response-orders.dto";
import { ProductVariant } from "generated/prisma";
import { Product } from "generated/prisma";
import { OrderStatus } from "generated/prisma";
import { StockLogService } from "src/stock-log/stock-log.service";
import { StockLogType } from "generated/prisma";
import { CreatePaymentDto } from "./dtos/pay/create-payment.dto";
import { PayOrderResponseDto } from "./dtos/pay/response-payment.dto";
import { PaymentStatus } from "generated/prisma";

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService,
    private readonly stockLogService: StockLogService) { }
  async create(createOrdersDto: CreateOrdersDto, userId: string): Promise<ResponseOrdersDto> {
    try {

      const lookup: Record<string, { productId: string; variantId: string | null; quantity: number }> = {};
      const normalizedItems: Array<{ productId: string; variantId: string | null; quantity: number }> = [];

      for (const item of createOrdersDto.items) {
        const variantId = item.variantId ?? null;
        const key = `${item.productId}:${variantId}`;

        if (lookup[key]) {
          lookup[key].quantity += item.quantity;
        } else {
          lookup[key] = {
            productId: item.productId,
            variantId,
            quantity: item.quantity,
          };
        }
      }

      for (const value of Object.values(lookup)) {
        normalizedItems.push(value);
      }

      if (normalizedItems.length === 0) {
        throw new BadRequestException('Order items cannot be empty');
      }

      const productIds = normalizedItems.map(item => item.productId);

      const variantIds = Array.from(
        new Set(
          normalizedItems
            .filter(
              (item): item is { productId: string; variantId: string; quantity: number } =>
                item.variantId !== null
            )
            .map(item => item.variantId)
        )
      );

      const order = await this.prisma.$transaction(async (tx) => {

        //user
        const user = await tx.user.findUnique({
          where: { id: userId },
        });
        if (!user) {
          throw new NotFoundException('User not found');
        }

        //products
        const products = await tx.product.findMany({
          where: {
            id: { in: productIds },
          },
        });
        if (products.length !== productIds.length) {
          throw new NotFoundException('Some products not found');
        }

        //variants
        let variants: ProductVariant[] = [];
        if (variantIds.length > 0) {
          variants = await tx.productVariant.findMany({
            where: {
              id: { in: variantIds },
            },
          });
          if (variants.length !== variantIds.length) {
            throw new NotFoundException('Some variants not found');
          }
        }

        let lookupProducts: Record<string, Product> = {};
        for (let product of products) {
          if (!lookupProducts[product.id]) {
            lookupProducts[product.id] = product;
          }
        }

        const lookupVariants: Record<string, ProductVariant> = {};
        for (let variant of variants) {
          if (!lookupVariants[variant.id]) {
            lookupVariants[variant.id] = variant;
          }
        }

        //variant product matching
        for (let product of normalizedItems) {
          if (product.variantId !== null) {
            const variant = lookupVariants[product.variantId];
            if (variant.productId !== product.productId) {
              throw new BadRequestException('Variant does not belong to product');
            }
          }
        }

        //single vendor rule
        let productVendorIds = new Set(products.map(product => product.vendorId));
        if (productVendorIds.size > 1) {
          throw new BadRequestException('Multiple products with different vendors are not allowed');
        }
        const vendorId = products[0].vendorId;

        //price snapshot
        const orderItemDrafts: {
          productId: string;
          variantId: string | null;
          quantity: number;
          price: number;
        }[] = [];

        for (let item of normalizedItems) {
          let unitPrice: number;

          if (item.variantId !== null) {
            const variantPrice = lookupVariants[item.variantId].price;
            if (variantPrice == null) {
              throw new BadRequestException('Variant price is not set');
            }
            unitPrice = variantPrice;
          } else {
            if (lookupProducts[item.productId].basePrice == null) {
              throw new BadRequestException('Product base price is not set');
            }
            unitPrice = lookupProducts[item.productId].basePrice;
          }

          orderItemDrafts.push({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: unitPrice,
          });
        }
        const totalPrice = orderItemDrafts.reduce((acc, item) => acc + item.price * item.quantity, 0);
        if (totalPrice <= 0) {
          throw new BadRequestException('Total price is not valid');
        }
        if (!Number.isFinite(totalPrice)) {
          throw new BadRequestException('Total price is invalid');
        }

        normalizedItems.sort((a, b) => {

          if (a.productId !== b.productId) {
            return a.productId.localeCompare(b.productId);
          }
          const aVariant = a.variantId
          const bVariant = b.variantId

          if (aVariant === null && bVariant === null) {
            return 0;
          }

          if (aVariant === null) {
            return 1
          }
          if (bVariant === null) {
            return -1;
          }

          return aVariant.localeCompare(bVariant);
        })

        for (const item of normalizedItems) {

          //variant product
          if (item.variantId !== null) {
            const result = await tx.productVariant.updateMany({
              where: {
                id: item.variantId,
                stock: {
                  gte: item.quantity,
                },
              },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });

            if (result.count === 0) {
              throw new ConflictException('Insufficient variant stock');
            }

            await this.stockLogService.createStockLog(tx, {
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              type: StockLogType.OUT,
            });
          }
          //simple product
          else {
            const result = await tx.product.updateMany({
              where: {
                id: item.productId,
                stock: {
                  gte: item.quantity,
                },
              },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });

            if (result.count === 0) {
              throw new ConflictException('Insufficient product stock');
            }

            await this.stockLogService.createStockLog(tx, {
              productId: item.productId,
              quantity: item.quantity,
              type: StockLogType.OUT,
            });
          }
        }

        const order = await tx.order.create({
          data: {
            userId: userId,
            vendorId: vendorId,
            totalPrice: totalPrice,
            status: OrderStatus.PENDING,
            shippingAddress: createOrdersDto.shippingAddress,
            shippingCity: createOrdersDto.shippingCity,
            shippingCountry: createOrdersDto.shippingCountry,
            shippingZip: createOrdersDto.shippingZip,
          },
        });

        await tx.orderItem.createMany({
          data: orderItemDrafts.map(item => ({
            orderId: order.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
          })),
        });

        const createdOrder = await tx.order.findUnique({
          where: { id: order.id },
          include: { items: true },
        });

        if (!createdOrder) {
          throw new InternalServerErrorException('Order not found after creation');
        }

        return createdOrder;
      });

      const response: ResponseOrdersDto = {
        id: order.id,
        status: order.status,
        totalPrice: order.totalPrice,
        createdAt: order.createdAt,
        shippingAddress: order.shippingAddress,
        shippingCity: order.shippingCity,
        shippingCountry: order.shippingCountry,
        shippingZip: order.shippingZip,
        items: order.items.map(item => ({
          productId: item.productId,
          variantId: item.variantId ?? undefined,
          quantity: item.quantity,
          price: item.price,
        })),
      };
      return response;
    }
    catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create order');
    }
  }

  async pay(createPaymentDto: CreatePaymentDto, userId: string, orderId: string): Promise<PayOrderResponseDto> {
    try {

      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      })
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      if (order.userId !== userId) {
        throw new ForbiddenException('You are not allowed to pay this order');
      }
      if (order.status === OrderStatus.PAID) {
        throw new ConflictException('Order is already paid');
      }
      if (order.status !== OrderStatus.PENDING) {
        throw new ConflictException('Order cannot be paid in its current status');
      }

      const paymentCompleted = await this.prisma.$transaction(async (tx) => {


        const createdPayment = await tx.payment.create({
          data: {
            orderId: orderId,
            amount: order.totalPrice,
            paymentMethod: createPaymentDto.paymentMethod,
            status: PaymentStatus.PAID,
          },
        });

        const updateResult = await tx.order.updateMany({
          where: {
            id: orderId,
            status: OrderStatus.PENDING,
          },
          data: {
            status: OrderStatus.PAID,
          },
        });
        if (updateResult.count === 0) {
          throw new ConflictException('Order status has changed and cannot be paid');
        }

        return createdPayment;

      });

      const response: PayOrderResponseDto = {
        order: {
          id: order.id,
          status: OrderStatus.PAID,
          totalPrice: order.totalPrice,
        },
        payment: {
          id: paymentCompleted.id,
          amount: paymentCompleted.amount,
          status: paymentCompleted.status,
          paymentMethod: paymentCompleted.paymentMethod,
          createdAt: paymentCompleted.createdAt,
        },
      };

      return response;

    }
    catch (error) {
      if (error instanceof NotFoundException
        || error instanceof ForbiddenException
        || error instanceof ConflictException
        || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to pay order');
    }
  }
}