import { IsNotEmpty, IsString, IsNumber, IsOptional, Min} from "class-validator";
import { Type } from "class-transformer";

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
    price: number;
    
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    stock: number;

    @IsOptional()
    @IsString()
    categoryId: string;
}