import { Module } from "@nestjs/common";
import { VariantController } from "./variant.controller";
import { VariantService } from "./variant.service";
import { StockLogModule } from "src/stock-log/stock-log.module";

@Module({
    imports: [StockLogModule],
    controllers: [VariantController],
    providers: [VariantService],
    exports: [VariantService],
})
export class VariantModule {}
