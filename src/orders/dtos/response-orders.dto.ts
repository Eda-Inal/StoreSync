import { OrderStatus } from "generated/prisma";
import { ResponseOrderItemDto } from "./response-order-item.dto";

export class ResponseOrdersDto {
  id: string;
  status: OrderStatus;
  totalPrice: number;
  createdAt: Date;

  shippingAddress: string;
  shippingCity: string;
  shippingCountry: string;
  shippingZip: string;

  items: ResponseOrderItemDto[];
}
