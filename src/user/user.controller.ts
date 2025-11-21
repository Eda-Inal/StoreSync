import { Controller, Post, Body, ValidationPipe } from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dtos/create-user.dto";
import { UserResponseDto } from "./dtos/user-response.dto";

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    create(@Body(new ValidationPipe()) createUserDto: CreateUserDto): UserResponseDto {
     return this.userService.create(createUserDto);  
 
    }
}