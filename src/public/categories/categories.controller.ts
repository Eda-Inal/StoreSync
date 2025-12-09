import { Controller, Get } from "@nestjs/common";
import { ResponseCategoryDto } from "./dtos/response-category.dto";
import { CategoriesService } from "./categories.service";

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoryService: CategoriesService) {}


    @Get()
    async findAll() {
        return await this.categoryService.findAll();
    }
}