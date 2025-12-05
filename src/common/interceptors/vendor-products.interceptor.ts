import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { ResponseProductDto } from "src/products/dtos/response-product.dto";
import { map } from 'rxjs/operators';
import { sendResponse } from "src/helper/response.helper";
import type { Product } from "generated/prisma";


@Injectable()
export class VendorProductsResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                // array (GET /vendor/products)
                if (Array.isArray(data)) {
                    const response = data.map((product) => this.toVendorProductsResponseDto(product));
                    return sendResponse(response);
                }

                // (GET /vendor/products/:id, POST, PATCH)
                const response = this.toVendorProductsResponseDto(data);
                return sendResponse(response);
            }),
        );
    }

    private toVendorProductsResponseDto(product: Product): ResponseProductDto {
        return {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            categoryId: product.categoryId,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        };
    }
}