import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { ResponseVendorDto } from "src/vendor/dtos/response-vendor.dto";
import { map } from 'rxjs/operators';
import { sendResponse } from "src/helper/response.helper";
import type { User } from "generated/prisma";


@Injectable()
export class VendorResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                // array (GET /vendors)
                if (Array.isArray(data)) {
                    const response = data.map((vendor) => this.toVendorResponseDto(vendor));
                    return sendResponse(response);
                }

                // (GET /vendors/:id, POST, PATCH)
                const response = this.toVendorResponseDto(data);
                return sendResponse(response);
            }),
        );
    }

    private toVendorResponseDto(vendor: Omit<User, 'password'>): ResponseVendorDto {
        return {
            id: vendor.id,
            name: vendor.name,
            email: vendor.email,
            role: vendor.role,
            createdAt: vendor.createdAt,
            updatedAt: vendor.updatedAt,
        };
    }
}