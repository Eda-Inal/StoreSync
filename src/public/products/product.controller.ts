import { Controller, Get } from "@nestjs/common";
import { ProductService } from "./product.service";
import { ResponseProductDto } from "./dtos/response-product.dto";

@Controller('products')
export class ProductController {
    constructor(private readonly productsService: ProductService) { }

    @Get()
    async findAll() {
        return this.productsService.findAll();
    }
}