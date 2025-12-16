import { Injectable, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException, ConflictException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateOrdersDto } from "./dtos/create-orders.dto";
import { ResponseOrdersDto } from "./dtos/response-orders.dto";
import { ProductVariant } from "generated/prisma";
import { Product } from "generated/prisma";


@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) { }
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
  
      });
      
    } catch (error) {
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
  
}