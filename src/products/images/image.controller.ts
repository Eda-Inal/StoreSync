import { Controller, UseInterceptors, UploadedFile, Param, Post, HttpCode, Delete } from "@nestjs/common";
import { ImageService } from "./image.service";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { UseGuards } from "@nestjs/common";
import { User } from "src/common/decorators/user.decorator";
import { ResponseImageDto } from "./dtos/response-image.dto";
import type { UserPayload } from "src/common/types/user-payload.type";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Express } from 'express';
import 'multer';


@Controller('vendor/products/:productId/images')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('VENDOR')

export class ImageController {
    constructor(private readonly imageService: ImageService) { }
    @Post()
    @HttpCode(201)
    @UseInterceptors(FileInterceptor('file'))
    async upload(@User() user: UserPayload, @Param('productId') productId: string, @UploadedFile() file: Express.Multer.File): Promise<ResponseImageDto> {
        const image = await this.imageService.upload(user.id, productId, file);
        const responseImageDto: ResponseImageDto = {
            id: image.id,
            url: image.url,
            createdAt: image.createdAt,
            updatedAt: image.createdAt
        };
        return responseImageDto;
    }
    @Delete(':imageId')
    @HttpCode(204)
    async delete(@User() user: UserPayload, @Param('productId') productId: string, @Param('imageId') imageId: string): Promise<void> {
        await this.imageService.delete(user.id, productId, imageId);
    }
}