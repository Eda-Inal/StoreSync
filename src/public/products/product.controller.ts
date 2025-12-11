import { Controller, Get, Param, UseInterceptors } from "@nestjs/common";
import { ProductService } from "./product.service";
import { PublicProductsResponseInterceptor } from "src/common/interceptors/public-products.interceptor";

@Controller('products')
@UseInterceptors(PublicProductsResponseInterceptor)
export class ProductController {
    constructor(private readonly productsService: ProductService) { }

    @Get()
    async findAll() {
        return this.productsService.findAll();
    }
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }
}