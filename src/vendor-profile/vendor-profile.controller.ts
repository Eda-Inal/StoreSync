import { Controller, Post, UseGuards, Body, HttpCode, Param, ForbiddenException, Get, Put, Delete,UseInterceptors } from "@nestjs/common";
import { VendorProfileService } from "./vendor-profile.service";
import { CreateVendorProfileDto } from "./create-vendor-profile.dto";
import { UpdateVendorProfileDto } from "./update-vendor-profile.dto";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { sendResponse } from "src/helper/response.helper";
import { User } from "src/common/decorators/user.decorator";
import type { UserPayload } from "src/common/types/user-payload.type";
import { VendorProfileResponseInterceptor } from "src/common/interceptors/vendor-profile.interceptor";

@Controller('vendor-profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('VENDOR')
@UseInterceptors(VendorProfileResponseInterceptor)
export class VendorProfileController {
  constructor(private readonly vendorProfileService: VendorProfileService) { }

  @Post()
  @HttpCode(201)
  async create(@Body() createVendorProfileDto: CreateVendorProfileDto, @User() user: UserPayload) {

    const profile = await this.vendorProfileService.create(createVendorProfileDto, user.id);
    return profile;

  }
  @Get()
  async findMe(@User() user: UserPayload) {
    const profile = await this.vendorProfileService.findMe(user.id);
    return profile;
  }
  @Put()
  async updateMe(@Body() updateVendorProfileDto: UpdateVendorProfileDto, @User() user: UserPayload) {
    const profile = await this.vendorProfileService.updateMe(updateVendorProfileDto, user.id);
    return profile;
  }
  @Delete()
  async deleteMe(@User() user: UserPayload) {
    await this.vendorProfileService.deleteMe(user.id);
    return sendResponse({ message: 'Vendor profile deleted successfully' });
  }
}

