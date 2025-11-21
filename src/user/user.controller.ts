import { Controller, Post, Get, Body, Put, Delete, ValidationPipe, Param } from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dtos/create-user.dto";
import { UserResponseDto } from "./dtos/user-response.dto";
import { UpdateUserDto } from "./dtos/update-user.dto";

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

    @Put(':id')
    update(@Param('id') id: string, @Body(new ValidationPipe()) updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
        return this.userService.updateService(id, updateUserDto);
    }

    @Delete(':id')
    delete(@Param('id') id: string): Promise<void> {
        return this.userService.deleteService(id);
    }
}