import { Controller, Post, Body, HttpCode } from "@nestjs/common";
import { OrdersService } from "./order.service";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { UseGuards } from "@nestjs/common";
import { CreateOrdersDto } from "./dtos/create-orders.dto";
import { User } from "src/common/decorators/user.decorator";
import type { UserPayload } from "src/common/types/user-payload.type";

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER')

export class OrdersController {
    constructor(private readonly orderService: OrdersService) { }

    @Post()
    @HttpCode(201)
    async create(@Body() createOrdersDto: CreateOrdersDto, @User() user: UserPayload) {
        return await this.orderService.create(createOrdersDto, user.id);
    }
}