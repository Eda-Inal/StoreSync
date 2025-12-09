import { Injectable, InternalServerErrorException, ConflictException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateCategoryDto } from "./dtos/create-category.dto";
import type { Category } from "generated/prisma";

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
}   