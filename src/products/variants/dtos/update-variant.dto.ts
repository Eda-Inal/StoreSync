import { IsString, IsNotEmpty, IsInt, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateVariantDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  value: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock: number;

  @IsOptional() 
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number | null;
}
