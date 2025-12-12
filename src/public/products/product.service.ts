import {Injectable, InternalServerErrorException, NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductType } from 'generated/prisma';
import { PublicProductDetailDto } from './dtos/response-product.dto';
import { PublicVariantDto } from './dtos/response-variant.dto';

@Injectable()
export class ProductService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(): Promise<PublicProductDetailDto[]> {
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
                    variants: {
                        where: { deletedAt: null },
                    },
                    category: true,
                },
            });

            return products.map((product): PublicProductDetailDto => {
                const images = product.images.map((img) => img.url);

                if (product.productType === ProductType.SIMPLE) {
                    return {
                        id: product.id,
                        name: product.name,
                        description: product.description,
                        minPrice: product.basePrice,
                        maxPrice: product.basePrice,
                        inStock: product.stock > 0,
                        images,
                        category: product.category
                            ? {
                                  id: product.category.id,
                                  name: product.category.name,
                              }
                            : null,
                    };
                }

                const variants: PublicVariantDto[] = product.variants.map(
                    (variant) => {
                        const price =
                            variant.price ?? product.basePrice;

                        return {
                            id: variant.id,
                            name: variant.name,
                            value: variant.value,
                            price,
                            inStock: variant.stock > 0,
                        };
                    },
                );

                const prices = variants.map((v) => v.price);
                const totalStock = product.variants.reduce(
                    (sum, v) => sum + v.stock,
                    0,
                );

                return {
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    minPrice: Math.min(...prices),
                    maxPrice: Math.max(...prices),
                    inStock: totalStock > 0,
                    images,
                    category: product.category
                        ? {
                              id: product.category.id,
                              name: product.category.name,
                          }
                        : null,
                };
            });
        } catch (error) {
            throw new InternalServerErrorException(
                'Failed to retrieve products',
            );
        }
    }

    async findOne(id: string): Promise<PublicProductDetailDto> {
        try {
            const product = await this.prisma.product.findUnique({
                where: { id },
                include: {
                    images: true,
                    variants: {
                        where: { deletedAt: null },
                    },
                    category: true,
                    vendor: true,
                },
            });

            if (
                !product ||
                product.deletedAt !== null ||
                product.vendor.deletedAt !== null ||
                (product.category &&
                    product.category.deletedAt !== null)
            ) {
                throw new NotFoundException('Product not found');
            }

            const images = product.images.map((img) => img.url);

            // SIMPLE PRODUCT
            if (product.productType === ProductType.SIMPLE) {
                return {
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    minPrice: product.basePrice,
                    maxPrice: product.basePrice,
                    inStock: product.stock > 0,
                    images,
                    category: product.category
                        ? {
                              id: product.category.id,
                              name: product.category.name,
                          }
                        : null,
                };
            }

            // VARIANTED PRODUCT
            const variants: PublicVariantDto[] = product.variants.map(
                (variant) => {
                    const price =
                        variant.price ?? product.basePrice;

                    return {
                        id: variant.id,
                        name: variant.name,
                        value: variant.value,
                        price,
                        inStock: variant.stock > 0,
                    };
                },
            );

            const prices = variants.map((v) => v.price);
            const totalStock = product.variants.reduce(
                (sum, v) => sum + v.stock,
                0,
            );

            return {
                id: product.id,
                name: product.name,
                description: product.description,
                minPrice: Math.min(...prices),
                maxPrice: Math.max(...prices),
                inStock: totalStock > 0,
                images,
                category: product.category
                    ? {
                          id: product.category.id,
                          name: product.category.name,
                      }
                    : null,
                variants,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(
                'Failed to retrieve product',
            );
        }
    }
}
