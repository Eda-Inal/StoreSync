import { Injectable, ForbiddenException, NotFoundException, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import type { ProductImage } from "generated/prisma";
import type { StorageProvider } from "./providers/storage-provider.interface";


@Injectable()
export class ImageService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storageProvider: StorageProvider
    ) { }

    async upload(userId: string, productId: string, file: Express.Multer.File): Promise<ProductImage> {
        try {
            const vendor = await this.prisma.vendor.findUnique({
                where: { userId: userId }
            });
            if (!vendor) {
                throw new ForbiddenException('Access denied');
            }
            if (vendor.deletedAt !== null) {
                throw new ForbiddenException('Vendor account is inactive');
            }
            const product = await this.prisma.product.findUnique({
                where: { id: productId }
            });
            if (!product) {
                throw new NotFoundException('Product not found');
            }
            if (product.deletedAt !== null) {
                throw new NotFoundException('Product not found');
            }
            if (product.vendorId !== vendor.id) {
                throw new ForbiddenException('Access denied');
            }
            if (!file) {
                throw new BadRequestException('File is required');
            }
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

            if (!allowedMimeTypes.includes(file.mimetype)) {
                throw new BadRequestException('Invalid image type. Only JPEG, PNG or WEBP are allowed.');
            }
            const MAX_FILE_SIZE = 5 * 1024 * 1024;
            if (file.size > MAX_FILE_SIZE) {
                throw new BadRequestException('File size exceeds the maximum allowed size of 5MB');
            }
            const imageUrl = await this.storageProvider.upload(file);

            const image = await this.prisma.productImage.create({
                data: {
                    productId,
                    url: imageUrl,
                },
            });
            return image;
        }
        catch (error: any) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to upload image');
        }
    }
}