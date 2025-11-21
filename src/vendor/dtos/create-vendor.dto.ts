import { IsNotEmpty, IsString, IsEmail, MinLength, isEmail } from "class-validator";

export class CreateVendorDto {

    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    name: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    password: string;


}