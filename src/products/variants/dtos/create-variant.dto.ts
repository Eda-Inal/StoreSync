import { IsString, IsNotEmpty, IsInt } from 'class-validator';
export class CreateVariantDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    value: string;

    @IsNotEmpty()
    @IsInt()
    stock: number;
}