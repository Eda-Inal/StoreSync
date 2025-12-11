import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { ResponseProductDto } from "src/public/products/dtos/response-product.dto";
import { map } from 'rxjs/operators';
import { sendResponse } from "src/helper/response.helper";


@Injectable()
export class PublicProductsResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                if (data === undefined || data === null) {
                    return data;
                }

                if (Array.isArray(data)) {
                    const response = data.map((product) => this.toPublicProductsResponseDto(product));
                    return sendResponse(response);
                }

                const response = this.toPublicProductsResponseDto(data);
                return sendResponse(response);
            }),
        );
    }

    private toPublicProductsResponseDto(product: ResponseProductDto): ResponseProductDto {
        return {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            inStock: product.inStock,
            lowStock: product.lowStock,
            category: product.category,
            images: product.images,
            variants: product.variants,
        };
    }
}

