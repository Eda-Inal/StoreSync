import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { VendorProfileResponseDto } from "src/vendor-profile/vendor-profile-response.dto";
import { map } from 'rxjs/operators';
import { sendResponse } from "src/helper/response.helper";
import type { Vendor } from "generated/prisma";


@Injectable()
export class VendorProfileResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                if (data === undefined || data === null) {
                    return data;
                }

                // array (GET /vendors)
                if (Array.isArray(data)) {
                    const response = data.map((vendor) => this.toVendorProfileResponseDto(vendor));
                    return sendResponse(response);
                }

                // (GET /vendors/:id, POST, PATCH)
                const response = this.toVendorProfileResponseDto(data);
                return sendResponse(response);
            }),
        );
    }

    private toVendorProfileResponseDto(vendor: Vendor): VendorProfileResponseDto {
        return {
            id: vendor.id,
            userId: vendor.userId,
            slug: vendor.slug,
            description: vendor.description,
            logoUrl: vendor.logoUrl,
            coverUrl: vendor.coverUrl,
            phone: vendor.phone,
            address: vendor.address,
            city: vendor.city,
            country: vendor.country,
            zipCode: vendor.zipCode,
            createdAt: vendor.createdAt,
            updatedAt: vendor.updatedAt,
        };
    }
}