import { Controller, Post, Body, ValidationPipe, Get, Param, Put, Delete } from "@nestjs/common"
import { VendorService } from "./vendor.service";
import { CreateVendorDto } from "./dtos/create-vendor.dto";
import { ResponseVendorDto } from "./dtos/response-vendor.dto";
import { UpdateVendorDto } from "./dtos/update-vendor.dto";

@Controller('vendors')
export class VendorController {
    constructor(private readonly vendorService: VendorService) { }

    @Post()
    create(@Body(new ValidationPipe()) createVendorDto: CreateVendorDto): Promise<ResponseVendorDto> {
        return this.vendorService.create(createVendorDto);
    }

    @Get()
    findAll(): Promise<ResponseVendorDto[]> {
        return this.vendorService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<ResponseVendorDto> {
        return this.vendorService.findOne(id);
    }

    @Put(':id')
    updateService(@Param('id') id: string, @Body(new ValidationPipe()) updateVendorDto: UpdateVendorDto): Promise<ResponseVendorDto> {
        return this.vendorService.updateService(id, updateVendorDto);
    }

    @Delete(':id')
    deleteService(@Param('id') id: string): Promise<void> {
        return this.vendorService.deleteService(id);
    }
}