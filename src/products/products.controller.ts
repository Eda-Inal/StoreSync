import { Controller, HttpCode, Post, Body, Get, Param, Put, Delete, UseInterceptors } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { UseGuards } from "@nestjs/common";
import { CreateProductDto } from "./dtos/create-product.dto";
import { VendorProductDetailDto } from "./dtos/response-product.dto";
import { UpdateProductDto } from "./dtos/update-product.dto";
import { User } from "src/common/decorators/user.decorator";
import type { UserPayload } from "src/common/types/user-payload.type";
import { VendorProductsResponseInterceptor } from "src/common/interceptors/vendor-products.interceptor";

@Controller('vendor/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('VENDOR')
@UseInterceptors(VendorProductsResponseInterceptor)
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }
    @Post()
    @HttpCode(201)
    async create(@Body() createProductDto: CreateProductDto, @User() user: UserPayload): Promise<VendorProductDetailDto> {
        return await this.productsService.create(createProductDto, user.id);
    }

    @Get()
    async findAll(@User() user: UserPayload) {
        return await this.productsService.findAll(user.id);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @User() user: UserPayload) {
        return await this.productsService.findOne(id, user.id);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @User() user: UserPayload) {
        return await this.productsService.update(id, updateProductDto, user.id);
    }

    @Delete(':id')
    @HttpCode(204)
    async delete(@Param('id') id: string, @User() user: UserPayload) {
        await this.productsService.delete(id, user.id);
    }
}
