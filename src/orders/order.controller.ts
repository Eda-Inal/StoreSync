import { Controller, Post, Body, HttpCode, UseInterceptors, Param } from "@nestjs/common";
import { OrdersService } from "./order.service";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { UseGuards } from "@nestjs/common";
import { CreateOrdersDto } from "./dtos/create-orders.dto";
import { User } from "src/common/decorators/user.decorator";
import type { UserPayload } from "src/common/types/user-payload.type";
import { OrdersResponseInterceptor } from "src/common/interceptors/order-response.interceptor";
import { CreatePaymentDto } from "./dtos/pay/create-payment.dto";

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER')

export class OrdersController {
    constructor(private readonly orderService: OrdersService) { }

    @Post()
    @HttpCode(201)
    @UseInterceptors(OrdersResponseInterceptor)
    async create(@Body() createOrdersDto: CreateOrdersDto, @User() user: UserPayload) {
        return await this.orderService.create(createOrdersDto, user.id);
    }

    @Post(':id/pay')
    async pay(@Body() createPaymentDto: CreatePaymentDto, @User() user: UserPayload, @Param('id') id: string) {
        return await this.orderService.pay(createPaymentDto, user.id, id);
    }
}