import { IsString, IsNotEmpty, IsOptional, MinLength,MaxLength } from "class-validator";
export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(20)
    name: string;

    @IsString()
    @IsOptional()
    description: string;
}