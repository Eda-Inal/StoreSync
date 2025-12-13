import { Module } from "@nestjs/common";
import { StockLogService } from "./stock-log.service";

@Module({
    providers: [StockLogService],
    exports: [StockLogService],
})
export class StockLogModule {}