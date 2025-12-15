import { Injectable, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateOrdersDto } from "./dtos/create-orders.dto";
import { ResponseOrdersDto } from "./dtos/response-orders.dto";
import { OrderItems } from "src/common/types/order-items.type";

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

        }
        catch (error) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof ConflictException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to create order');
        }

    }
}