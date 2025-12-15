import { IsString, IsNotEmpty, IsInt, IsNumber, IsOptional, Min, } from "class-validator";

export class CreateOrderItemDto {

    @IsString()
    @IsNotEmpty()
    productId: string;

    @IsString()
    @IsOptional()
    variantId?: string;

    @IsInt()
    @Min(1)
    quantity: number;
}