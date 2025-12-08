import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateVariantDto } from "./dtos/create-variant.dto";
import type { ProductVariant } from "generated/prisma";
import { UpdateVariantDto } from "./dtos/update-variant.dto";


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

    async update(updateVariantDto: UpdateVariantDto, userId: string, productId: string, variantId: string): Promise<ProductVariant> {
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
            const variant = await this.prisma.productVariant.findUnique({
                where: { id: variantId }
            });
            if (!variant) {
                throw new NotFoundException('Variant not found');
            }
            if (variant.productId !== productId) {
                throw new ForbiddenException('Access denied');
            }

            const product = await this.prisma.product.findUnique({
                where: { id: variant.productId }
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
            if (updateVariantDto.name !== undefined || updateVariantDto.value !== undefined) {
                const existingVariant = await this.prisma.productVariant.findFirst({
                    where: {
                        productId: variant.productId,
                        value: updateVariantDto.value ? updateVariantDto.value : variant.value,
                        name: updateVariantDto.name ? updateVariantDto.name : variant.name
                    }
                });
                if (existingVariant && existingVariant.id !== variantId) {
                    throw new ConflictException('Variant already exists');
                }
            }

            const updatedVariant = await this.prisma.productVariant.update({
                where: { id: variantId },
                data: {
                    name: updateVariantDto.name,
                    value: updateVariantDto.value,
                    stock: updateVariantDto.stock
                }
            });
            return updatedVariant;
        }
        catch (error: any) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof ConflictException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to update variant');
        }
    }

    async delete(userId: string, productId: string, variantId: string): Promise<void> {
        try {
            const vendor = await this.prisma.vendor.findUnique({
                where: { userId: userId }
            });
            if (!vendor) {
                throw new ForbiddenException('Access denied');
            }
            if (vendor.deletedAt !== null) {
                throw new ForbiddenException('Vendor account is inactive');
            }
            const variant = await this.prisma.productVariant.findUnique({
                where: { id: variantId }
            });
            if (!variant) {
                throw new NotFoundException('Variant not found');
            }
            if (variant.productId !== productId) {
                throw new ForbiddenException('Access denied');
            }
            const product = await this.prisma.product.findUnique({
                where: { id: variant.productId }
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
            await this.prisma.productVariant.delete({
                where: { id: variantId }
            });
        }
        catch (error: any) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to delete variant');
        }
    }

}