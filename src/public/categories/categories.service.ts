import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import type { Category } from "generated/prisma";

@Injectable()
export class CategoriesService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(): Promise<Category[]> {
        try {
            const categories = await this.prisma.category.findMany({
                where: {
                    deletedAt: null
                }
            });
            return categories;
        }
        catch (error) {
            throw new InternalServerErrorException('Failed to retrieve categories');
        }
    }
}