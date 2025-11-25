import { Controller, Post, Body, ValidationPipe, Get, Param, Put, Delete } from "@nestjs/common"
import { VendorService } from "./vendor.service";
import { CreateVendorDto } from "./dtos/create-vendor.dto";
import { ResponseVendorDto } from "./dtos/response-vendor.dto";
import { UpdateVendorDto } from "./dtos/update-vendor.dto";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UseGuards } from "@nestjs/common";


@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class VendorController {
    constructor(private readonly vendorService: VendorService) { }

    @Post()
    create(@Body(new ValidationPipe()) createVendorDto: CreateVendorDto) {
        return this.vendorService.create(createVendorDto);
    }

    
    @Get()
    findAll() {
        return this.vendorService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.vendorService.findOne(id);
    }

    @Put(':id')
    updateService(@Param('id') id: string, @Body(new ValidationPipe()) updateVendorDto: UpdateVendorDto) {
        return this.vendorService.updateService(id, updateVendorDto);
    }

    @Delete(':id')
    deleteService(@Param('id') id: string) {
        return this.vendorService.deleteService(id);
    }
}