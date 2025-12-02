import { Controller, Post, UseGuards, Body, HttpCode, Param, ForbiddenException, Get, Put, Delete } from "@nestjs/common";
import { VendorProfileService } from "./vendor-profile.service";
import { CreateVendorProfileDto } from "./create-vendor-profile.dto";
import { UpdateVendorProfileDto } from "./update-vendor-profile.dto";
import { VendorProfileResponseDto } from "./vendor-profile-response.dto";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { sendResponse } from "src/helper/response.helper";
import { User } from "src/common/decorators/user.decorator";
import type { UserPayload } from "src/common/types/user-payload.type";

@Controller('vendor-profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('VENDOR')
export class VendorProfileController {
  constructor(private readonly vendorProfileService: VendorProfileService) { }

  @Post()
  @HttpCode(201)
  async create(@Body() createVendorProfileDto: CreateVendorProfileDto, @User() user: UserPayload) {

    const profile = await this.vendorProfileService.create(createVendorProfileDto, user.id);
    const vendorProfileResponseDto: VendorProfileResponseDto = {
      id: profile.id,
      userId: profile.userId,
      slug: profile.slug,
      description: profile.description,
      logoUrl: profile.logoUrl,
      coverUrl: profile.coverUrl,
      phone: profile.phone,
      address: profile.address,
      city: profile.city,
      country: profile.country,
      zipCode: profile.zipCode,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
    return sendResponse(vendorProfileResponseDto);

  }
  @Get('me')
  async findMe(@User() user: UserPayload) {
    const profile = await this.vendorProfileService.findMe(user.id);
    const vendorProfileResponseDto: VendorProfileResponseDto = {
      id: profile.id,
      userId: profile.userId,
      slug: profile.slug,
      description: profile.description,
      logoUrl: profile.logoUrl,
      coverUrl: profile.coverUrl,
      phone: profile.phone,
      address: profile.address,
      city: profile.city,
      country: profile.country,
      zipCode: profile.zipCode,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
    return sendResponse(vendorProfileResponseDto);
  }
  @Put('me')
  async updateMe(@Body() updateVendorProfileDto: UpdateVendorProfileDto, @User() user: UserPayload) {
    const profile = await this.vendorProfileService.updateMe(updateVendorProfileDto, user.id);
    const vendorProfileResponseDto: VendorProfileResponseDto = {
      id: profile.id,
      userId: profile.userId,
      slug: profile.slug,
      description: profile.description,
      logoUrl: profile.logoUrl,
      coverUrl: profile.coverUrl,
      phone: profile.phone,
      address: profile.address,
      city: profile.city,
      country: profile.country,
      zipCode: profile.zipCode,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
    return sendResponse(vendorProfileResponseDto);
  }
  @Delete('me')
  async deleteMe(@User() user: UserPayload) {
    await this.vendorProfileService.deleteMe(user.id);
    return sendResponse({ message: 'Vendor profile deleted successfully' });
  }
}

