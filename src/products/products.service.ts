import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateProductDto } from "./dtos/create-product.dto";
import type { Product } from "generated/prisma";
import { UpdateProductDto } from "./dtos/update-product.dto";
@Injectable()
export class ProductsService {
    constructor(private readonly prisma: PrismaService) { }
    async create(createProductDto: CreateProductDto, userId: string): Promise<Product> {
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
            if (createProductDto.categoryId) {
                const category = await this.prisma.category.findUnique({
                    where: { id: createProductDto.categoryId }
                });
                if (!category) {
                    throw new NotFoundException('Category not found');
                }
            }
            //should add category id soft delete check logic
            const product = await this.prisma.product.create({
                data: {
                    name: createProductDto.name,
                    description: createProductDto.description,
                    price: createProductDto.price,
                    stock: createProductDto.stock,
                    vendorId: vendor.id,
                    categoryId: createProductDto.categoryId,
                }
            });
            return product;
        }
        catch (error: any) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to create product');
        }
    }

    async findAll(userId: string): Promise<Product[]> {
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
            const products = await this.prisma.product.findMany({
                where: {
                    vendorId: vendor.id,
                    deletedAt: null
                },
            });
            return products
        }
        catch (error: any) {
            if (error instanceof ForbiddenException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to retrieve products');
        }
    }

    async findOne(productId: string, userId: string): Promise<Product> {
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
                where: {
                    id: productId,
                    vendorId: vendor.id,
                    deletedAt: null
                }
            });
            if (!product) {
                throw new NotFoundException('Product not found');
            }
            return product;
        }
        catch (error: any) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to retrieve product');

        }
    }

    async update(productId: string, updateProductDto: UpdateProductDto, userId: string): Promise<Product> {
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
            const updateData: any = {};

            if (updateProductDto.name !== undefined) updateData.name = updateProductDto.name;
            if (updateProductDto.description !== undefined) updateData.description = updateProductDto.description;
            if (updateProductDto.price !== undefined) {
                if (updateProductDto.price < 0) {
                    throw new BadRequestException('Price cannot be negative');
                }
                updateData.price = updateProductDto.price;
            }
            if (updateProductDto.stock !== undefined) {
                if (updateProductDto.stock < 0) {
                    throw new BadRequestException('Stock cannot be negative');
                }
                updateData.stock = updateProductDto.stock;
            }
            if (updateProductDto.categoryId === null) {
                updateData.categoryId = null;
            } else if (typeof updateProductDto.categoryId === 'string') {

                const category = await this.prisma.category.findUnique({
                    where: { id: updateProductDto.categoryId }
                });

                if (!category) {
                    throw new NotFoundException('Category not found');
                }

                //if soft delete is added, check if category is deleted

                updateData.categoryId = updateProductDto.categoryId;
            }
            const updatedProduct = await this.prisma.product.update({
                where: { id: productId},
                data: updateData
            });
            return updatedProduct;


        }
        catch (error: any) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to update product');
        }
    }
}