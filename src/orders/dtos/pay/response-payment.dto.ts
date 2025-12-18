import { OrderStatus, PaymentMethod, PaymentStatus } from "generated/prisma";

export class PayOrderResponseDto {
  order: {
    id: string;
    status: OrderStatus;
    totalPrice: number;
  };

  payment: {
    id: string;
    amount: number;
    status: PaymentStatus;
    paymentMethod: PaymentMethod;
    createdAt: Date;
  };
}
