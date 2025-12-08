import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateVariantDto } from "./dtos/create-variant.dto";
import type { ProductVariant } from "generated/prisma";


@Injectable()
export class VariantService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createVariantDto: CreateVariantDto, userId: string, productId: string): Promise<ProductVariant> {
        try {
            const vendor = await this.prisma.vendor.findUnique({
                where: { userId: userId }
            });
            if (!vendor) {
                throw new ForbiddenException('Vendor not found');
            }
            if (vendor.deletedAt !== null) {
                throw new ForbiddenException('Vendor account is inactive');
            }

            const product = await this.prisma.product.findUnique({
                where: { id: productId }
            });
            if (!product) {
                throw new NotFoundException('Product not found');
            }
            if (product.deletedAt !== null) {
                throw new NotFoundException('Product not found');
            }
            if (product.vendorId !== vendor.id) {
                throw new ForbiddenException('Access denied');
            }
            const variantExists = await this.prisma.productVariant.findFirst({
                where: { name: createVariantDto.name, value: createVariantDto.value, productId: productId }
            });
            if (variantExists) {
                throw new ConflictException('Variant already exists');
            }
            const variant = await this.prisma.productVariant.create({
                data: {
                    name: createVariantDto.name,
                    value: createVariantDto.value,
                    stock: createVariantDto.stock,
                    productId: productId
                }
            });
            return variant;
        }
        catch (error: any) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof ConflictException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to create variant');
        }
    }
}