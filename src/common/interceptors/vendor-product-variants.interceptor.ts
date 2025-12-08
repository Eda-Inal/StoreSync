import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { ResponseVariantDto } from "src/products/variants/dtos/response-variant.dto";
import { map } from 'rxjs/operators';
import { sendResponse } from "src/helper/response.helper";
import type { ProductVariant } from "generated/prisma";


@Injectable()
export class VendorProductVariantsResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                // array (GET /vendor/products/:productId/variants)
                if (Array.isArray(data)) {
                    const response = data.map((variant) => this.toVendorProductVariantsResponseDto(variant));
                    return sendResponse(response);
                }

                // (GET /vendor/products/:productId/variants/:variantId, POST, PATCH)
                const response = this.toVendorProductVariantsResponseDto(data);
                return sendResponse(response);
            }),
        );
    }

    private toVendorProductVariantsResponseDto(variant: ProductVariant): ResponseVariantDto {
        return {
            id: variant.id,
            name: variant.name,
            value: variant.value,
            stock: variant.stock,
            createdAt: variant.createdAt,
            updatedAt: variant.updatedAt,
        };
    }
}