import { Controller, HttpCode, Post, Body } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { UseGuards } from "@nestjs/common";
import { CreateProductDto } from "./dtos/create-product.dto";
import { ResponseProductDto } from "./dtos/response-product.dto";
import { User } from "src/common/decorators/user.decorator";
import type { UserPayload } from "src/common/types/user-payload.type";


@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('VENDOR')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }
    @Post()
    @HttpCode(201)
    async create(@Body() createProductDto: CreateProductDto, @User() user: UserPayload): Promise<ResponseProductDto> {
        const product = await this.productsService.create(createProductDto, user.id);
        const responseProductDto: ResponseProductDto = {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            categoryId: product.categoryId,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        }
        return responseProductDto;
    }
}
