import { Controller, Post, Body, HttpCode, Put, Param, Delete, Get, UseInterceptors } from "@nestjs/common";
import { CategoryService } from "./category.service";
import { CreateCategoryDto } from "./dtos/create-category.dto";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UseGuards } from "@nestjs/common";
import { UpdateCategoryDto } from "./dtos/update-category.dto";
import { AdminCategoriesResponseInterceptor } from "src/common/interceptors/admin-categories.interceptor";


@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@UseInterceptors(AdminCategoriesResponseInterceptor)
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    @Post()
    @HttpCode(201)
    async create(@Body() createCategoryDto: CreateCategoryDto) {
        return await this.categoryService.create(createCategoryDto);
    }

    @Post('bulk')
    @HttpCode(201)
    async createBulk(@Body() createCategoryDto: CreateCategoryDto[]) {
        return await this.categoryService.createBulk(createCategoryDto);
    }

    @Get()
    async findAll() {
        return await this.categoryService.findAll();
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
        return await this.categoryService.update(id, updateCategoryDto);
    }

    @Delete(':id')
    @HttpCode(204)
    async delete(@Param('id') id: string) {
        await this.categoryService.delete(id);
    }
}
