import { Controller, Post, Body, Get, UseGuards, UseInterceptors, HttpCode, Put } from "@nestjs/common"
import { AdminService } from "./admin.service";
import { CreateAdminDto } from "./dtos/create-admin.dto";
import { UpdateAdminDto } from "./dtos/update-admin.dto";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { AdminResponseInterceptor } from "src/common/interceptors/admin-response.interceptor";
import { User } from "src/common/decorators/user.decorator";
import type { UserPayload } from "src/common/types/user-payload.type";

@Controller('admins')
@UseInterceptors(AdminResponseInterceptor)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Post()
    @HttpCode(201)
    async create(@Body() createAdminDto: CreateAdminDto) {
        return await this.adminService.create(createAdminDto);
    }


    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async findOne(@User() user: UserPayload) {
        return await this.adminService.findOne(user.id);
    }

    @Put()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async update(@Body() updateAdminDto: UpdateAdminDto, @User() user: UserPayload) {
        return await this.adminService.update(updateAdminDto, user.id);
    }
}