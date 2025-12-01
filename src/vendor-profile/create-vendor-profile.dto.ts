import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class CreateVendorProfileDto {
    @IsString()
    @IsNotEmpty()
    slug: string;


    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsNotEmpty()
    logoUrl: string;

    @IsString()
    @IsNotEmpty()
    coverUrl: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsNotEmpty()
    address: string;

    @IsString()
    @IsNotEmpty()
    city: string;

    @IsString()
    @IsNotEmpty()
    country: string;

    @IsString()
    @IsNotEmpty()
    zipCode: string;
}