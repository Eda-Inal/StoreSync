import { Controller, Post, HttpCode, Body, Param, Put, Delete, UseInterceptors } from "@nestjs/common";
import { VariantService } from "./variant.service";
import { CreateVariantDto } from "./dtos/create-variant.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { UseGuards } from "@nestjs/common";
import { User } from "src/common/decorators/user.decorator";
import type { UserPayload } from "src/common/types/user-payload.type"
import { ResponseVariantDto } from "./dtos/response-variant.dto";
import { UpdateVariantDto } from "./dtos/update-variant.dto";
import { VendorProductVariantsResponseInterceptor } from "src/common/interceptors/vendor-product-variants.interceptor";

@Controller('vendor/products/:productId/variants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('VENDOR')
@UseInterceptors(VendorProductVariantsResponseInterceptor)

export class VariantController {
    constructor(private readonly variantService: VariantService) { }

    @Post()
    @HttpCode(201)
    async create(@Body() createVariantDto: CreateVariantDto, @User() user: UserPayload, @Param('productId') productId: string): Promise<ResponseVariantDto> {
        const variant = await this.variantService.create(createVariantDto, user.id, productId);
        return variant;
    }

    @Put(':variantId')
    async update(@Body() updateVariantDto: UpdateVariantDto, @User() user: UserPayload, @Param('productId') productId: string, @Param('variantId') variantId: string): Promise<ResponseVariantDto> {
        const variant = await this.variantService.update(updateVariantDto, user.id, productId, variantId);
        return variant;
    }
    @Delete(':variantId')
    async delete(@User() user: UserPayload, @Param('productId') productId: string, @Param('variantId') variantId: string): Promise<{ message: string }> {
        await this.variantService.delete(user.id, productId, variantId);
        return { message: 'Variant deleted successfully' };
    }
}


