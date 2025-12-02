import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateVendorProfileDto } from "./create-vendor-profile.dto";
import { ConflictException, InternalServerErrorException } from "@nestjs/common";
import { Vendor } from "generated/prisma";
import { UpdateVendorProfileDto } from "./update-vendor-profile.dto";



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
            console.error('Error creating vendor profile:', error);
            if (error?.code === 'P2002') {
                throw new ConflictException("Slug already exists");
            }
            if (error instanceof ConflictException) {
                throw error;
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
    async updateMe(updateVendorProfileDto: UpdateVendorProfileDto, userId: string): Promise<Vendor> {
        try {
            const vendor = await this.prisma.vendor.findUnique({
                where: { userId: userId }
            });
            if (!vendor) {
                throw new NotFoundException('Vendor profile not found');
            }
            if (updateVendorProfileDto.slug) {
                const vendorWithSameSlug = await this.prisma.vendor.findUnique({
                    where: { slug: updateVendorProfileDto.slug }
                });
                if (vendorWithSameSlug && vendorWithSameSlug.id !== vendor.id) {
                    throw new ConflictException('Slug already exists');
                }
            }
            const updatedVendor = await this.prisma.vendor.update({
                where: { userId: userId },
                data: {
                    slug: updateVendorProfileDto.slug,
                    description: updateVendorProfileDto.description,
                    logoUrl: updateVendorProfileDto.logoUrl,
                    coverUrl: updateVendorProfileDto.coverUrl,
                    phone: updateVendorProfileDto.phone,
                    address: updateVendorProfileDto.address,
                    city: updateVendorProfileDto.city,
                    country: updateVendorProfileDto.country,
                    zipCode: updateVendorProfileDto.zipCode,
                }
            });

            return updatedVendor;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to update vendor profile');
        }
    }
    async deleteMe(userId: string): Promise<void> {
        try{
            const vendor = await this.prisma.vendor.findUnique({
                where:{userId:userId}
            });
            if(!vendor){
                throw new NotFoundException('Vendor profile not found');
            }
            const orderCount = await this.prisma.order.count({
                where:{vendorId:vendor.id}
        })
            if(orderCount > 0){
                throw new ConflictException('You have orders associated with your profile, ');
            }
            await this.prisma.vendor.update({
                where:{userId:userId},
                data:{
                    deletedAt:new Date(),
                    isActive:false
                }
            });


        }catch(error){
            if( error instanceof NotFoundException){
                throw error;
            }
            throw new InternalServerErrorException('Failed to delete vendor profile');
        }
    }

}