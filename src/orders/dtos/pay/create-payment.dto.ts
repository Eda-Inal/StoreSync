import { IsEnum } from "class-validator";
import { PaymentMethod } from "generated/prisma";

export class CreatePaymentDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
