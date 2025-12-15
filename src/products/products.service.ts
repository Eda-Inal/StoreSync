import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateProductDto } from "./dtos/create-product.dto";
import { UpdateProductDto } from "./dtos/update-product.dto";
import { ProductType } from "generated/prisma";
import { VendorProductDetailDto } from "./dtos/response-product.dto";
import { VendorProductListDto } from "./dtos/response-products.dto";
import { StockLogService } from "src/stock-log/stock-log.service";
import { StockLogType } from "generated/prisma";

@Injectable()
export class ProductsService {
    constructor(private readonly prisma: PrismaService, private readonly stockLogService: StockLogService) { }
    async create(createProductDto: CreateProductDto, userId: string): Promise<VendorProductDetailDto> {
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

            if (createProductDto.categoryId) {
                const category = await this.prisma.category.findUnique({
                    where: { id: createProductDto.categoryId }
                });

                if (!category) {
                    throw new NotFoundException('Category not found');
                }
                if (category.deletedAt !== null) {
                    throw new NotFoundException('Category is deleted');
                }
            }

            let product;
            await this.prisma.$transaction(async (tx) => {

                if (createProductDto.productType === ProductType.SIMPLE) {
                    if (createProductDto.stock === undefined) {
                        throw new BadRequestException('Stock is required for simple product');
                    }
                    if (createProductDto.stock < 0) {
                        throw new BadRequestException('Stock cannot be negative');
                    }

                    product = await tx.product.create({
                        data: {
                            name: createProductDto.name,
                            description: createProductDto.description,
                            basePrice: createProductDto.basePrice,
                            stock: createProductDto.stock,
                            vendorId: vendor.id,
                            categoryId: createProductDto.categoryId,
                            productType: ProductType.SIMPLE,
                        }
                    });
                    if (createProductDto.stock > 0) {
                        await this.stockLogService.createStockLog(tx, {
                            productId: product.id,
                            quantity: createProductDto.stock,
                            type: StockLogType.IN,
                        })
                    }
                }


                else if (createProductDto.productType === ProductType.VARIANTED) {
                    if (createProductDto.stock !== undefined) {
                        throw new BadRequestException('Stock is not allowed for variant product');
                    }

                    product = await tx.product.create({
                        data: {
                            name: createProductDto.name,
                            description: createProductDto.description,
                            basePrice: createProductDto.basePrice,
                            vendorId: vendor.id,
                            categoryId: createProductDto.categoryId,
                            productType: ProductType.VARIANTED,
                            stock: 0,
                        }
                    });
                }

                else {
                    throw new BadRequestException("Invalid product type");
                }
            });

            return await this.findOne(product.id, userId);

        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof ForbiddenException ||
                error instanceof BadRequestException
            ) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to create product');
        }
    }


    async findAll(userId: string): Promise<VendorProductListDto[]> {
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

            const products = await this.prisma.product.findMany({
                where: {
                    vendorId: vendor.id,
                    deletedAt: null
                },
                include: {
                    variants: {
                        where: { deletedAt: null }
                    }
                }
            });

            return products.map(product => {
                let totalStock = 0;

                if (product.productType === ProductType.SIMPLE) {
                    totalStock = product.stock;
                } else {
                    totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
                }

                let minPrice = product.basePrice;
                let maxPrice = product.basePrice;

                if (product.productType === ProductType.VARIANTED) {
                    const prices = product.variants.map(v => v.price ?? product.basePrice);
                    if (prices.length > 0) {
                        minPrice = Math.min(...prices);
                        maxPrice = Math.max(...prices);
                    }
                }

                return {
                    id: product.id,
                    name: product.name,
                    productType: product.productType,
                    basePrice: product.basePrice,
                    totalStock,
                    minPrice,
                    maxPrice,
                    variantCount: product.variants.length,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt
                };
            });
        } catch (error: any) {
            if (error instanceof ForbiddenException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to retrieve products');
        }
    }


    async findOne(productId: string, userId: string): Promise<VendorProductDetailDto> {
        try {
            const vendor = await this.prisma.vendor.findUnique({
                where: { userId },
            });
            if (!vendor) {
                throw new ForbiddenException('Vendor not found');
            }
            if (vendor.deletedAt !== null) {
                throw new ForbiddenException('Vendor account is inactive');
            }

            const product = await this.prisma.product.findFirst({
                where: {
                    id: productId,
                    vendorId: vendor.id,
                    deletedAt: null,
                },
                include: {
                    variants: {
                        where: { deletedAt: null },
                    },
                },
            });

            if (!product) {
                throw new NotFoundException('Product not found');
            }

            let totalStock = 0;
            if (product.productType === ProductType.SIMPLE) {
                totalStock = product.stock;
            } else if (product.productType === ProductType.VARIANTED) {
                totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
            }

            let minPrice = product.basePrice;
            let maxPrice = product.basePrice;

            if (product.productType === ProductType.VARIANTED) {
                const prices = product.variants.map(v => v.price ?? product.basePrice);
                if (prices.length > 0) {
                    minPrice = Math.min(...prices);
                    maxPrice = Math.max(...prices);
                }
            }

            return {
                id: product.id,
                name: product.name,
                description: product.description,
                productType: product.productType,
                basePrice: product.basePrice,
                categoryId: product.categoryId,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
                totalStock,
                minPrice,
                maxPrice,
                variants: product.variants.map(v => ({
                    id: v.id,
                    name: v.name,
                    value: v.value,
                    stock: v.stock,
                    price: v.price,
                    sku: v.sku,
                    createdAt: v.createdAt,
                    updatedAt: v.updatedAt,
                })),
            };
        } catch (error: any) {
            if (
                error instanceof NotFoundException ||
                error instanceof ForbiddenException
            ) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to retrieve product');
        }
    }


    async update(productId: string, updateProductDto: UpdateProductDto, userId: string): Promise<VendorProductDetailDto> {
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

            const product = await this.prisma.product.findFirst({
                where: { id: productId, vendorId: vendor.id, deletedAt: null }
            });

            if (!product) {
                throw new NotFoundException('Product not found');
            }

            const updateData: any = {};

            if (updateProductDto.name !== undefined) updateData.name = updateProductDto.name;

            if (updateProductDto.description !== undefined) updateData.description = updateProductDto.description;

            if (updateProductDto.basePrice !== undefined) {
                if (updateProductDto.basePrice < 0) {
                    throw new BadRequestException('Price cannot be negative');
                }
                updateData.basePrice = updateProductDto.basePrice;
            }

            if (updateProductDto.categoryId === null) {
                updateData.categoryId = null;
            }
            else if (typeof updateProductDto.categoryId === 'string') {
                const category = await this.prisma.category.findUnique({
                    where: { id: updateProductDto.categoryId },
                });

                if (!category) {
                    throw new NotFoundException('Category not found');
                }
                if (category.deletedAt !== null) {
                    throw new NotFoundException('Category is deleted');
                }

                updateData.categoryId = updateProductDto.categoryId;
            }
            let stockLog:
                | { type: StockLogType; quantity: number }
                | null = null;

            if (updateProductDto.stock !== undefined) {
                if (product.productType !== ProductType.SIMPLE) {
                    throw new BadRequestException('Stock is not allowed for variant product');
                }

                if (updateProductDto.stock < 0) {
                    throw new BadRequestException('Stock cannot be negative');
                }

                if (updateProductDto.stock !== product.stock) {
                    if (updateProductDto.stock > product.stock) {
                        stockLog = {
                            type: StockLogType.IN,
                            quantity: updateProductDto.stock - product.stock
                        };
                    } else {
                        stockLog = {
                            type: StockLogType.OUT,
                            quantity: product.stock - updateProductDto.stock
                        };
                    }
                }
                updateData.stock = updateProductDto.stock;
            }
            await this.prisma.$transaction(async (tx) => {

                await tx.product.update({
                    where: { id: productId },
                    data: updateData
                });
                if (stockLog) {
                    await this.stockLogService.createStockLog(tx, {
                        productId: product.id,
                        quantity: stockLog.quantity,
                        type: stockLog.type,
                    });
                }
            });
            return await this.findOne(productId, userId);

        } catch (error: any) {
            if (
                error instanceof NotFoundException ||
                error instanceof ForbiddenException ||
                error instanceof BadRequestException
            ) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to update product');
        }
    }


    async delete(productId: string, userId: string): Promise<void> {
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
            const product = await this.prisma.product.findFirst({
                where: { id: productId, vendorId: vendor.id, deletedAt: null }
            });
            if (!product) {
                throw new NotFoundException('Product not found');
            }
            await this.prisma.product.update({
                where: { id: productId },
                data: { deletedAt: new Date() }
            });
        }
        catch (error: any) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to delete product');
        }
    }
}