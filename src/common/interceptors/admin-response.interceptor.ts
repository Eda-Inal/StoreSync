import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { ResponseAdminDto } from "src/admin/dtos/response-sdmin.dto";
import { map } from 'rxjs/operators';
import { sendResponse } from "src/helper/response.helper";
import type { User } from "generated/prisma";


@Injectable()
export class AdminResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                // array (GET /admins)
                if (Array.isArray(data)) {
                    const response = data.map((admin) => this.toAdminResponseDto(admin));
                    return sendResponse(response);
                }

                // (GET /admins/:id, POST, PATCH)
                const response = this.toAdminResponseDto(data);
                return sendResponse(response);
            }),
        );
    }

    private toAdminResponseDto(admin: Omit<User, 'password'>): ResponseAdminDto {
        return {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            createdAt: admin.createdAt,
            updatedAt: admin.updatedAt,
        };
    }
}