import { Controller, Post, Body, HttpCode, Put, Param, Delete } from "@nestjs/common";
import { CategoryService } from "./category.service";
import { CreateCategoryDto } from "./dtos/create-category.dto";
import { ResponseCategoryDto } from "./dtos/response-category.dto";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UseGuards } from "@nestjs/common";
import { UpdateCategoryDto } from "./dtos/update-category.dto";


@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')

export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    @Post()
    @HttpCode(201)
    async create(@Body() createCategoryDto: CreateCategoryDto) {
        const category = await this.categoryService.create(createCategoryDto);

        const responseCategoryDto: ResponseCategoryDto = {
            id: category.id,
            name: category.name,
            description: category.description || '',
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        }
        return responseCategoryDto;
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
        const category = await this.categoryService.update(id, updateCategoryDto);
        const responseCategoryDto: ResponseCategoryDto = {
            id: category.id,
            name: category.name,
            description: category.description || '',
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        }
        return responseCategoryDto;
    }

    @Delete(':id')
    @HttpCode(204)
    async delete(@Param('id') id: string) {
        await this.categoryService.delete(id);
        return { message: 'Category deleted successfully' };
    }
}
