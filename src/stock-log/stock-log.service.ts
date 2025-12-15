import { Injectable } from '@nestjs/common';
import { Prisma, StockLogType } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StockLogService {
    constructor(private readonly prisma: PrismaService) { }

    async createStockLog(
        prismaClient: Prisma.TransactionClient | PrismaService,
        params: {
            productId: string;
            quantity: number;
            type: StockLogType;
            variantId?: string;
        },
    ) {
        return prismaClient.stockLog.create({
            data: {
                productId: params.productId,
                quantity: params.quantity,
                type: params.type,
                variantId: params.variantId ?? null,
            },
        });
    }
}
