import { Controller, Post, Get, Body, Put, Delete, Param, HttpCode, ForbiddenException, Patch, UseInterceptors } from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dtos/create-user.dto";
import { UpdateUserDto } from "./dtos/update-user.dto";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UseGuards } from "@nestjs/common";
import { User } from "src/common/decorators/user.decorator";
import type { UserPayload } from "src/common/types/user-payload.type";
import { UserResponseInterceptor } from "src/common/interceptors/user-response.interceptor";


@Controller('users')
@UseInterceptors(UserResponseInterceptor)
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post()
    @HttpCode(201)
    async create(@Body() createUserDto: CreateUserDto) {
      return await this.userService.create(createUserDto);
       
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async getAll() {
        return await this.userService.findAll();
    }

    @Get(':id')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('USER', 'ADMIN')
    async getOne(@Param('id') id: string, @User() user: UserPayload) {
        if (user.role === 'USER' && user.id !== id)
            throw new ForbiddenException();
        return await this.userService.findOne(id);
    }

    @Patch(':id')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('USER')
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @User() user: UserPayload) {
        if (user.id !== id) {
            throw new ForbiddenException('You are not authorized to access this resource');
        }
        return await this.userService.updateService(id, updateUserDto);
    }

    @Delete(':id')
    @HttpCode(204)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('USER')
    async delete(@Param('id') id: string, @User() user: UserPayload) {
        if (user.id !== id) {
            throw new ForbiddenException('You are not authorized to access this resource');
        }
        await this.userService.deleteService(id);
    }
}