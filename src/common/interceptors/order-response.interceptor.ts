import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common"
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { sendResponse } from "src/helper/response.helper";
import { ResponseOrdersDto } from "src/orders/dtos/response-orders.dto";
  
  @Injectable()
  export class OrdersResponseInterceptor implements NestInterceptor {
    intercept(
      context: ExecutionContext,
      next: CallHandler,
    ): Observable<any> {
      return next.handle().pipe(
        map((data: ResponseOrdersDto | ResponseOrdersDto[]) => {
          if (data === undefined || data === null) {
            return data;
          }
  
          // array response (GET /orders)
          if (Array.isArray(data)) {
            return sendResponse(
              data.map((order) => this.toResponseDto(order)),
            );
          }
  
          // single response (POST /orders, GET /orders/:id)
          return sendResponse(this.toResponseDto(data));
        }),
      );
    }
  
    private toResponseDto(order: ResponseOrdersDto): ResponseOrdersDto {
      return {
        id: order.id,
        status: order.status,
        totalPrice: order.totalPrice,
        createdAt: order.createdAt,
        shippingAddress: order.shippingAddress,
        shippingCity: order.shippingCity,
        shippingCountry: order.shippingCountry,
        shippingZip: order.shippingZip,
        items: order.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
      };
    }
  }
  