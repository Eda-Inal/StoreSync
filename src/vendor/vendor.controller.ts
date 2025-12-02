import { Controller, Post, Body, Get, Param, HttpCode,UseInterceptors } from "@nestjs/common"
import { VendorService } from "./vendor.service";
import { CreateVendorDto } from "./dtos/create-vendor.dto";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UseGuards } from "@nestjs/common";
import { VendorResponseInterceptor } from "src/common/interceptors/vendor-response.interceptor";


@Controller('vendors')
@UseInterceptors(VendorResponseInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class VendorController {
    constructor(private readonly vendorService: VendorService) { }

    @Post()
    @HttpCode(201)
    async create(@Body() createVendorDto: CreateVendorDto) {
        return await this.vendorService.create(createVendorDto);
    }


    @Get()
    async findAll() {
        return await this.vendorService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.vendorService.findOne(id);
    }
}