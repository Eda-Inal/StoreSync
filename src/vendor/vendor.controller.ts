import { Controller, Post, Body, ValidationPipe, Get, Param, Put, Delete, HttpCode } from "@nestjs/common"
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
    @HttpCode(201)
    async create(@Body() createVendorDto: CreateVendorDto) {
        const vendor = await this.vendorService.create(createVendorDto);
        const responseVendorDto: ResponseVendorDto = {
            id: vendor.id,
            name: vendor.name,
            email: vendor.email,
            role: vendor.role,
            createdAt: vendor.createdAt,
            updatedAt: vendor.updatedAt
        }
        return responseVendorDto;
    }


    @Get()
    async findAll() {
        const vendors = await this.vendorService.findAll();
        const responseVendorsDto: ResponseVendorDto[] = vendors.map(vendor => {
            return {
                id: vendor.id,
                name: vendor.name,
                email: vendor.email,
                role: vendor.role,
                createdAt: vendor.createdAt,
                updatedAt: vendor.updatedAt
            }
        });
        return responseVendorsDto;
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
         const vendor = await this.vendorService.findOne(id);
         const responseVendorDto: ResponseVendorDto = {
            id: vendor.id,
            name: vendor.name,
            email: vendor.email,
            role: vendor.role,
            createdAt: vendor.createdAt,
            updatedAt: vendor.updatedAt
         }
         return responseVendorDto;
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