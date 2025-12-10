import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { ResponseProductDto } from "./dtos/response-product.dto";

@Injectable()
export class ProductService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(): Promise<ResponseProductDto[]> {
        try {
            const products = await this.prisma.product.findMany({
                where: {
                    deletedAt: null
                },
                include: {
                    images: true,
                    variants: true,
                    category: true,
                    vendor: true,
                }
            });

            const filteredProducts = products.filter((product) => {
                if (product.vendor.deletedAt !== null) {
                    return false;
                }

                if (product.category?.deletedAt !== null) {
                    return false;
                }
                return true;
            });

            const mappedProducts = filteredProducts.map((product) => {
                const hasVariants = product.variants.length > 0;
                const threshold = 5;

                if (hasVariants) {
                    const variantInStockStates = product.variants.map(v => v.stock > 0);
                    const isInStock = variantInStockStates.some(state => state === true);
                    const isLowStock =
                        isInStock &&
                        product.variants.every(v => v.stock < threshold);

                    const variantDtos = product.variants.map(v => ({
                        id: v.id,
                        name: v.name,
                        value: v.value,
                        inStock: v.stock > 0,
                    }));

                    return {
                        id: product.id,
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        inStock: isInStock,
                        lowStock: isLowStock,
                        images: product.images.map(img => img.url),
                        variants: variantDtos,
                        category: product.category
                            ? { id: product.category.id, name: product.category.name }
                            : null,
                    };
                }

                const isInStock = product.stock > 0;
                const isLowStock = product.stock > 0 && product.stock < threshold;

                return {
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    inStock: isInStock,
                    lowStock: isLowStock,
                    images: product.images.map(img => img.url),
                    variants: [],
                    category: product.category
                        ? { id: product.category.id, name: product.category.name }
                        : null,
                };
            });

            return mappedProducts;

        } catch (error: any) {
            throw new InternalServerErrorException('Failed to retrieve products');
        }
    }

    async findOne(id: string): Promise<ResponseProductDto> {
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

            if (product.category?.deletedAt !== null) {
                throw new NotFoundException("Product not found");
            }


            const threshold = 5;
            const hasVariants = product.variants.length > 0;

            if (hasVariants) {
                const variantInStockStates = product.variants.map(v => v.stock > 0);
                const isInStock = variantInStockStates.some(state => state === true);
                const isLowStock =
                    isInStock &&
                    product.variants.every(v => v.stock < threshold);

                const variantDtos = product.variants.map(v => ({
                    id: v.id,
                    name: v.name,
                    value: v.value,
                    inStock: v.stock > 0,
                }));

                return {
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    inStock: isInStock,
                    lowStock: isLowStock,
                    images: product.images.map(img => img.url),
                    variants: variantDtos,
                    category: product.category
                        ? { id: product.category.id, name: product.category.name }
                        : null,
                };
            }

            const isInStock = product.stock > 0;
            const isLowStock = product.stock > 0 && product.stock < threshold;

            return {
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                inStock: isInStock,
                lowStock: isLowStock,
                images: product.images.map(img => img.url),
                variants: [],
                category: product.category
                    ? { id: product.category.id, name: product.category.name }
                    : null,
            };

        } catch (error: any) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to retrieve product');
        }
    }

}
