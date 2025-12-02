import { Controller, Post, Body, Get, Param, UseGuards, UseInterceptors, HttpCode, ForbiddenException, Patch } from "@nestjs/common"
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


    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async findOne(@Param('id') id: string, @User() user: UserPayload) {
        if (user.id !== id)
            throw new ForbiddenException('You are not authorized to access this resource');
        return await this.adminService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async updateService(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto, @User() user: UserPayload) {
        if (user.id !== id)
            throw new ForbiddenException('You are not authorized to access this resource');
        return await this.adminService.updateService(id, updateAdminDto);
    }
}