import { Module } from "@nestjs/common";
import { ImageService } from "./image.service";
import { ImageController } from "./image.controller";
import { LocalStorageProvider } from "./providers/local-storage.provider";


@Module({
    controllers: [ImageController],
    providers: [
        ImageService,
        LocalStorageProvider,
    ],
    exports: [ImageService],
})
export class ImageModule {}