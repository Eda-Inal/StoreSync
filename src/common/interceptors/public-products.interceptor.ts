import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { sendResponse } from 'src/helper/response.helper';
import { ProductType } from 'generated/prisma';

@Injectable()
export class PublicProductsResponseInterceptor implements NestInterceptor {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                if (!data) {
                    return data;
                }

                // GET /products
                if (Array.isArray(data)) {
                    const response = data.map((product) =>
                        this.mapToPublicProduct(product),
                    );
                    return sendResponse(response);
                }

                // GET /products/:id
                return sendResponse(this.mapToPublicProduct(data));
            }),
        );
    }

    private mapToPublicProduct(product: any) {
        const images = product.images.map((img) => img.url);

        // simple product
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
                    ? { id: product.category.id, name: product.category.name }
                    : null,
            };
        }

        // variants of product
        const variants = product.variants
            .filter((v) => v.deletedAt === null)
            .map((v) => {
                const price = v.price ?? product.basePrice;
                return {
                    id: v.id,
                    name: v.name,
                    value: v.value,
                    price,
                    inStock: v.stock > 0,
                };
            });

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
                ? { id: product.category.id, name: product.category.name }
                : null,
            variants,
        };
    }
}
