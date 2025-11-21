import { Controller, Post, Body, ValidationPipe, Get, Param } from "@nestjs/common";
import { VendorService } from "./vendor.service";
import { CreateVendorDto } from "./dtos/create-vendor.dto";
import { ResponseVendorDto } from "./dtos/response-vendor.dto";


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
}