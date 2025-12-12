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


    @Get('me')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('USER')
    async findMe(@User() user: UserPayload) {
        return await this.userService.findOne(user.id);
    }

    @Put('me')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('USER')
    async updateMe(
      @Body() updateUserDto: UpdateUserDto,
      @User() user: UserPayload,
    ) {
      return await this.userService.updateService(user.id, updateUserDto);
    }

    @Delete('me')
    @HttpCode(204)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('USER')
    async deleteMe(@User() user: UserPayload) {
      await this.userService.deleteService(user.id);
    }
    
}