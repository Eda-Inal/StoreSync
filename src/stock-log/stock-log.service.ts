import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { StockLogType } from "generated/prisma";

@Injectable()
export class StockLogService {
    constructor(private readonly prisma: PrismaService) {}
    async createStockLog(productId: string, quantity: number, type: StockLogType, variantId?: string) {
        return this.prisma.stockLog.create({
            data: {
                productId,
                quantity,
                type,
                variantId,
            },
        });
    }
}