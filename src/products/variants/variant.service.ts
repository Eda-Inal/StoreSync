import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateVariantDto } from "./dtos/create-variant.dto";
import type { ProductVariant } from "generated/prisma";
import { ProductType } from "generated/prisma";
import { UpdateVariantDto } from "./dtos/update-variant.dto";
import { StockLogService } from "src/stock-log/stock-log.service";
import { StockLogType } from "generated/prisma";

@Injectable()
export class VariantService {
    constructor(private readonly prisma: PrismaService, private readonly stockLogService: StockLogService) { }

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
                where: {
                    id: productId,
                    deletedAt: null
                }
            });
            if (!product) {
                throw new NotFoundException('Product not found');
            }
            if (product.vendorId !== vendor.id) {
                throw new ForbiddenException('Access denied');
            }
            if (product.productType !== ProductType.VARIANTED) {
                throw new BadRequestException("Variants are only allowed for VARIANTED products");
            }
            const variantExists = await this.prisma.productVariant.findFirst({
                where: {
                    name: createVariantDto.name, value: createVariantDto.value, productId: productId,
                    deletedAt: null
                }
            });
            if (variantExists) {
                throw new ConflictException('Variant already exists');
            }

            if (createVariantDto.price !== undefined && createVariantDto.price < 0) {
                throw new BadRequestException('Price cannot be negative');
            }
            let stock = createVariantDto.stock;
            if (createVariantDto.stock === undefined) {
                stock = 0;
            }
            if (stock < 0) {
                throw new BadRequestException('Stock cannot be negative');
            }
            const result = await this.prisma.$transaction(async (tx) => {
                const variant = await tx.productVariant.create({
                    data: {
                        name: createVariantDto.name,
                        value: createVariantDto.value,
                        stock: stock,
                        price: createVariantDto.price,
                        productId: productId,
                    }
                });
                if (stock > 0) {
                    await this.stockLogService.createStockLog(tx, {
                        productId: productId,
                        quantity: stock,
                        type: StockLogType.IN,
                        variantId: variant.id,
                    });
                }
                return variant;
            });
            return result;
        }
        catch (error: any) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof ConflictException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to create variant');
        }
    }

    async update(updateVariantDto: UpdateVariantDto, userId: string, productId: string, variantId: string): Promise<ProductVariant> {
        try {
            const vendor = await this.prisma.vendor.findUnique({
                where: { userId }
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
            if (!variant || variant.deletedAt !== null) {
                throw new NotFoundException('Variant not found');
            }
            if (variant.productId !== productId) {
                throw new ForbiddenException('Access denied');
            }
            const product = await this.prisma.product.findUnique({
                where: { id: variant.productId }
            });
            if (!product || product.deletedAt !== null) {
                throw new NotFoundException('Product not found');
            }
            if (product.vendorId !== vendor.id) {
                throw new ForbiddenException('Access denied');
            }
            if (product.productType !== ProductType.VARIANTED) {
                throw new BadRequestException('Variants are only allowed for VARIANTED products');
            }

            const existingVariant = await this.prisma.productVariant.findFirst({
                where: {
                    productId: variant.productId,
                    value: updateVariantDto.value,
                    name: updateVariantDto.name
                }
            });
            if (existingVariant && existingVariant.id !== variantId) {
                throw new ConflictException('Variant already exists');
            }

            const updateData: any = {};

            updateData.name = updateVariantDto.name;

            updateData.value = updateVariantDto.value;

            if (updateVariantDto.price !== null && updateVariantDto.price < 0) {
                throw new BadRequestException('Price cannot be negative');
            }
            updateData.price = updateVariantDto.price;

            let stock = updateVariantDto.stock;

            if (stock < 0) {
                throw new BadRequestException('Stock cannot be negative');
            }
            updateData.stock = stock;

            let stockLog: { type: StockLogType; quantity: number } | null = null;
            if (stock !== variant.stock) {
                if (stock > variant.stock) {
                    stockLog = { type: StockLogType.IN, quantity: stock - variant.stock };
                } else {
                    stockLog = { type: StockLogType.OUT, quantity: variant.stock - stock };
                }
            }

            const result = await this.prisma.$transaction(async (tx) => {
                const updatedVariant = await tx.productVariant.update({
                    where: { id: variantId },
                    data: updateData
                });
                if (stockLog) {
                    await this.stockLogService.createStockLog(tx, {
                        productId: productId,
                        quantity: stockLog.quantity,
                        type: stockLog.type,
                        variantId: variantId,
                    });
                }
                return updatedVariant;
            });
            return result;
        } catch (error: any) {
            if (
                error instanceof NotFoundException ||
                error instanceof ForbiddenException ||
                error instanceof ConflictException ||
                error instanceof BadRequestException
            ) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to update variant');
        }
    }

    async delete(userId: string, productId: string, variantId: string): Promise<void> {
        try {
            const vendor = await this.prisma.vendor.findUnique({
                where: { userId }
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
            if (!variant || variant.deletedAt !== null) {
                throw new NotFoundException('Variant not found');
            }
            if (variant.productId !== productId) {
                throw new ForbiddenException('Access denied');
            }
            const product = await this.prisma.product.findUnique({
                where: { id: variant.productId }
            });
            if (!product || product.deletedAt !== null) {
                throw new NotFoundException('Product not found');
            }
            if (product.vendorId !== vendor.id) {
                throw new ForbiddenException('Access denied');
            }
            if (product.productType !== ProductType.VARIANTED) {
                throw new BadRequestException('Variants are only allowed for VARIANTED products');
            }
            await this.prisma.productVariant.update({
                where: { id: variantId },
                data: { deletedAt: new Date() }
            });
        } catch (error: any) {
            if (
                error instanceof NotFoundException ||
                error instanceof ForbiddenException ||
                error instanceof BadRequestException
            ) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to delete variant');
        }
    }
}