import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { ResponseImageDto } from "src/products/images/dtos/response-image.dto";
import { map } from 'rxjs/operators';
import { sendResponse } from "src/helper/response.helper";
import type { ProductImage } from "generated/prisma";


@Injectable()
export class VendorProductImagesResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                if (data === undefined || data === null) {
                    return data;
                }

                // array (GET /vendor/products/:productId/images)
                if (Array.isArray(data)) {
                    const response = data.map((image) => this.toVendorProductImagesResponseDto(image));
                    return sendResponse(response);
                }

                // (POST /vendor/products/:productId/images)
                const response = this.toVendorProductImagesResponseDto(data);
                return sendResponse(response);
            }),
        );
    }

    private toVendorProductImagesResponseDto(image: ProductImage): ResponseImageDto {
        return {
            id: image.id,
            url: image.url,
            createdAt: image.createdAt,
            updatedAt: image.createdAt,
        };
    }
}

