import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, IsEnum } from "class-validator";
import { Type } from "class-transformer";
import { ProductType } from "generated/prisma";

export class CreateProductDto {

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    basePrice: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    stock?: number;

    @IsOptional()
    @IsString()
    categoryId: string;

    @IsNotEmpty()
    @IsEnum(ProductType)
    productType: ProductType;

}