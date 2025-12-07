import { Controller, Get,Param } from "@nestjs/common";
import { ProductService } from "./product.service";

@Controller('products')
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