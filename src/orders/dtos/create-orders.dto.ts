import { IsString, IsNotEmpty, IsArray, ValidateNested,ArrayMinSize } from "class-validator";
import { CreateOrderItemDto } from "./create-order-item.dto";
import { Type } from "class-transformer";
export class CreateOrdersDto {

    @IsString()
    @IsNotEmpty()
    shippingAddress: string;

    @IsString()
    @IsNotEmpty()
    shippingCity: string;

    @IsString()
    @IsNotEmpty()
    shippingCountry: string;

    @IsString()
    @IsNotEmpty()
    shippingZip: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];

}