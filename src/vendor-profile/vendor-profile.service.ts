import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateVendorProfileDto } from "./create-vendor-profile.dto";
import { ConflictException, InternalServerErrorException } from "@nestjs/common";
import { Vendor } from "generated/prisma";



@Injectable()
export class VendorProfileService {
    constructor(private readonly prisma: PrismaService) { }
    async create(createVendorProfileDto: CreateVendorProfileDto, userId: string): Promise<Vendor> {

        try {
            const vendor = await this.prisma.vendor.findUnique({
                where: { userId: userId }
            });
            if (vendor) {
                throw new ConflictException('Vendor profile already exists');
            }
            const createdVendorProfile = await this.prisma.vendor.create({
                data: {
                    userId: userId,
                    slug: createVendorProfileDto.slug,
                    description: createVendorProfileDto.description,
                    logoUrl: createVendorProfileDto.logoUrl,
                    coverUrl: createVendorProfileDto.coverUrl,
                    phone: createVendorProfileDto.phone,
                    address: createVendorProfileDto.address,
                    city: createVendorProfileDto.city,
                    country: createVendorProfileDto.country,
                    zipCode: createVendorProfileDto.zipCode,
                }
            });
            return createdVendorProfile;

        } catch (error: any) {
            if (error?.code === 'P2002') {
                throw new ConflictException("Slug already exists");
            }
            throw new InternalServerErrorException('Failed to create vendor profile')
        }

    }
    async findMe(userId: string): Promise<Vendor> {
        try {
            const vendor = await this.prisma.vendor.findUnique({
                where: { userId: userId }
            });
            if (!vendor) {
                throw new NotFoundException('Vendor profile not found');
            }
            return vendor;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to retrieve vendor profile');
        }
    }
}