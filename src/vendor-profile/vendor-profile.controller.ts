import { Controller, Post, UseGuards, Body, HttpCode } from "@nestjs/common";
import { VendorProfileService } from "./vendor-profile.service";
import { CreateVendorProfileDto } from "./create-vendor-profile.dto";
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
    return sendResponse(profile);
  }
}

