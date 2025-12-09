import { Injectable, InternalServerErrorException, ConflictException, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateCategoryDto } from "./dtos/create-category.dto";
import { UpdateCategoryDto } from "./dtos/update-category.dto";
import type { Category } from "generated/prisma";
import type { BulkCategoryResult } from "src/common/types/bulk-category.type";

@Injectable()
export class CategoryService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
        try {
            const trimmed = createCategoryDto.name.trim();
            const normalizedName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
            const categoryExists = await this.prisma.category.findFirst({
                where: {
                    name: {
                        equals: normalizedName,
                        mode: 'insensitive',
                    },
                },
            });
            if (categoryExists) {
                throw new ConflictException('Category already exists');
            }
            const category = await this.prisma.category.create({
                data: {
                    name: normalizedName,
                    description: createCategoryDto.description,
                }
            });
            return category;
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('Category already exists');
            }
            throw new InternalServerErrorException('Failed to create category');
        }
    }

    async createBulk(createCategoryDto: CreateCategoryDto[]): Promise<BulkCategoryResult[]> {

        if (createCategoryDto.length === 0) {
            throw new BadRequestException('No categories to create');
        }
        const results: BulkCategoryResult[] = [];
        for (const category of createCategoryDto) {
            try {
                const trimmed = category.name.trim();
                const normalizedName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
                const categoryExists = await this.prisma.category.findFirst({
                    where: {
                        name: {
                            equals: normalizedName,
                            mode: 'insensitive',
                        }
                    }
                });
                /// soft-deleted categories are also treated as duplicates.
                /// system does not allow creating a new category with the same name,
                /// even if the previous one is soft-deleted.

                if (categoryExists) {
                    results.push({ success: false, message: 'Category already exists' });
                    continue;
                }
                const createdCategory = await this.prisma.category.create({
                    data: {
                        name: normalizedName,
                        description: category.description,
                    }
                });
                results.push({ success: true, data: createdCategory });

            } catch (error) {
                results.push({
                    success: false,
                    message: "Failed to create category"
                })
            }
        }
        return results;
    }

    async findAll(): Promise<Category[]> {
        try {
            return await this.prisma.category.findMany();
        }
        catch (error) {
            throw new InternalServerErrorException('Failed to retrieve categories');
        }
    }

    async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
        try {
            const category = await this.prisma.category.findUnique({
                where: { id }
            });
            if (!category) {
                throw new NotFoundException('Category not found');
            }
            if (category.deletedAt !== null) {
                throw new NotFoundException('Category not found');
            }

            const trimmed = updateCategoryDto.name?.trim();
            const normalizedName = trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase() : category.name;
            if (normalizedName && normalizedName !== category.name) {
                const categoryExists = await this.prisma.category.findFirst({
                    where: {
                        name: {
                            equals: normalizedName,
                            mode: 'insensitive',
                        }
                    }
                });
                if (categoryExists) {
                    throw new ConflictException('Category already exists');
                }
            }
            const updatedCategory = await this.prisma.category.update({
                where: { id },
                data: {
                    name: updateCategoryDto.name ? normalizedName : category.name,
                    description: updateCategoryDto.description ? updateCategoryDto.description : category.description,
                }
            });
            return updatedCategory;
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('Category already exists');
            }
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to update category');
        }
    }

    async delete(id: string): Promise<void> {
        try {
            const category = await this.prisma.category.findUnique({ where: { id } });
            if (!category) {
                throw new NotFoundException('Category not found');
            }
            if (category.deletedAt !== null) {
                throw new NotFoundException('Category already deleted');
            }
            await this.prisma.category.update(
                {
                    where: { id },
                    data:
                        { deletedAt: new Date() }
                });
        }
        catch (error) {
            if (error instanceof NotFoundException || error instanceof ConflictException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to delete category');
        }
    }
}