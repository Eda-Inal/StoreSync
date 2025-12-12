import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Product } from "generated/prisma";

@Injectable()
export class ProductService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(): Promise<Product[]> {
        try {
            const products = await this.prisma.product.findMany({
                where: {
                    deletedAt: null,
                    vendor: {
                        deletedAt: null,
                    },
                    OR: [
                        { categoryId: null },
                        {
                            category: {
                                deletedAt: null,
                            },
                        },
                    ],
                },
                include: {
                    images: true,
                    variants: true,
                    category: true,
                    vendor: true,
                },
            });

            return products;

        } catch (error: any) {
            throw new InternalServerErrorException(
                'Failed to retrieve products',
            );
        }
    }


    async findOne(id: string): Promise<Product> {
        try {
            const product = await this.prisma.product.findUnique({
                where: { id },
                include: {
                    images: true,
                    variants: true,
                    category: true,
                    vendor: true,
                }
            });

            if (!product) {
                throw new NotFoundException('Product not found');
            }

            if (product.vendor.deletedAt !== null) {
                throw new NotFoundException('Product not found');
            }

            if (product.category && product.category.deletedAt !== null) {
                throw new NotFoundException("Product not found");
            }
            if (product.deletedAt !== null) {
                throw new NotFoundException('Product not found');
            }
            return product


        } catch (error: any) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to retrieve product');
        }
    }

}
