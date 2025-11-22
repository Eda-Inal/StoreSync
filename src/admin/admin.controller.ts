import { Controller, Post, Body, ValidationPipe, Get, Param, Put, Delete } from "@nestjs/common"
import { AdminService } from "./admin.service";
import { CreateAdminDto } from "./dtos/create-admin.dto";
import { ResponseAdminDto } from "./dtos/response-sdmin.dto";
import { UpdateAdminDto } from "./dtos/update-admin.dto";

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Post()
    create(@Body(new ValidationPipe()) createAdminDto: CreateAdminDto): Promise<ResponseAdminDto> {
        return this.adminService.create(createAdminDto);
    }

    @Get()
    findAll(): Promise<ResponseAdminDto[]> {
        return this.adminService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<ResponseAdminDto> {
        return this.adminService.findOne(id);
    }

    @Put(':id')
    updateService(@Param('id') id: string, @Body(new ValidationPipe()) updateAdminDto: UpdateAdminDto): Promise<ResponseAdminDto> {
        return this.adminService.updateService(id, updateAdminDto);
    }

    @Delete(':id')
    deleteService(@Param('id') id: string): Promise<void> {
        return this.adminService.deleteService(id);
    }
}