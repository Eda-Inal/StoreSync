import { Injectable, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException, ConflictException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateOrdersDto } from "./dtos/create-orders.dto";
import { ResponseOrdersDto } from "./dtos/response-orders.dto";
import { ProductVariant } from "generated/prisma";


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

        const user = await tx.user.findUnique({
          where: {
            id: userId,
          },
        });
        if (!user) {
          throw new NotFoundException('User not found');
        }
        const products = await tx.product.findMany({
          where: {
            id: {
              in: productIds,
            },
          },
        });
        let variants: ProductVariant[] = [];

        if (variantIds.length > 0) {
          variants = await tx.productVariant.findMany({
            where: {
              id: {
                in: variantIds,
              },
            },
          });
          if (variants.length !== variantIds.length) {
            throw new NotFoundException('Some variants not found');
          }
        }

        const lookupVariants: Record<string, ProductVariant> = {};

        for (let variant of variants) {
          if (!lookupVariants[variant.id]) {
            lookupVariants[variant.id] = variant
          }
        }
        for (let product of normalizedItems) {
          if (product.variantId !== null) {
            const variant = lookupVariants[product.variantId]
            if (variant.productId !== product.productId) {
              throw new BadRequestException('Variant does not belong to product');
            }
          }
        }




        if (products.length !== productIds.length) {
          throw new NotFoundException('Some products not found');
        }
      });
    }
    catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create order');
    }

  }
}