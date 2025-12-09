import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { ResponseCategoryDto } from "src/categories/dtos/response-category.dto";
import { map } from 'rxjs/operators';
import { sendResponse } from "src/helper/response.helper";
import type { Category } from "generated/prisma";


@Injectable()
export class AdminCategoriesResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                // array (GET /categories)
                if (Array.isArray(data)) {
                    const response = data.map((category) => this.toAdminCategoriesResponseDto(category));
                    return sendResponse(response);
                }

                // (GET /categories/:id, POST, PATCH)
                const response = this.toAdminCategoriesResponseDto(data);
                return sendResponse(response);
            }),
        );
    }

    private toAdminCategoriesResponseDto(category: Category): ResponseCategoryDto {
        return {
            id: category.id,
            name: category.name,
            description: category.description || '',
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        };
    }
}