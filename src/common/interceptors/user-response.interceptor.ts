import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { UserResponseDto } from "src/user/dtos/user-response.dto";
import { map } from 'rxjs/operators';
import { sendResponse } from "src/helper/response.helper";


@Injectable()
export class UserResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // array (GET /users)
        if (Array.isArray(data)) {
          const response = data.map((user) => this.toUserResponseDto(user));
          return sendResponse(response);
        }

        // (GET /users/:id, POST, PATCH)
        const response = this.toUserResponseDto(data);
        return sendResponse(response);
      }),
    );
  }

  private toUserResponseDto(user: any): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}