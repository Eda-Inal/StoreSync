import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class CreateVendorProfileDto {
    @IsString()
    @IsNotEmpty()
    slug: string;


    @IsString()
    @IsOptional()
    description: string;

    @IsString()
    @IsOptional()
    logoUrl: string;

    @IsString()
    @IsOptional()
    coverUrl: string;

    @IsString()
    @IsOptional()
    phone: string;

    @IsString()
    @IsOptional()
    address: string;

    @IsString()
    @IsOptional()
    city: string;

    @IsString()
    @IsOptional()
    country: string;

    @IsString()
    @IsOptional()
    zipCode: string;
}