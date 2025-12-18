import { Module } from "@nestjs/common";
import { OrdersService } from "./order.service";
import { OrdersController } from "./order.controller";
import { StockLogModule } from "src/stock-log/stock-log.module";

@Module({
    imports: [StockLogModule],
    controllers: [OrdersController],
    providers: [OrdersService],
    exports: [OrdersService],
})
export class OrdersModule {}