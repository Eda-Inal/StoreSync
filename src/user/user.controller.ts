import { Controller, Post, Get, Body, ValidationPipe, Param } from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dtos/create-user.dto";
import { UserResponseDto } from "./dtos/user-response.dto";

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post()
    create(@Body(new ValidationPipe()) createUserDto: CreateUserDto): Promise<UserResponseDto> {
        return this.userService.create(createUserDto);
    }

    @Get()
    getAll()
        : Promise<UserResponseDto[]> {
        return this.userService.findAll();
    }

    @Get(':id')
    getOne(@Param('id') id: string): Promise<UserResponseDto> {
        return this.userService.findOne(id);
    }
}