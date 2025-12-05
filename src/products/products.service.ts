import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateProductDto } from "./dtos/create-product.dto";
import type { Product } from "generated/prisma";

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
            if(createProductDto.categoryId){
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
}