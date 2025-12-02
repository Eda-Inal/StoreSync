import { Injectable, ConflictException, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateVendorDto } from "./dtos/create-vendor.dto";
import { ResponseVendorDto } from "./dtos/response-vendor.dto";
import { UpdateVendorDto } from "./dtos/update-vendor.dto";
import * as bcrypt from 'bcrypt';
import { sendResponse, sendError } from "src/helper/response.helper";
import type { User } from "generated/prisma";

@Injectable()
export class VendorService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createVendorDto: CreateVendorDto): Promise<Omit<User, 'password'>> {
        try {
            const hashedPassword = await bcrypt.hash(createVendorDto.password, 10);
            const createdVendor = await this.prisma.user.create({
                data: {
                    name: createVendorDto.name,
                    email: createVendorDto.email,
                    password: hashedPassword,
                    role: 'VENDOR'
                }
            })

            const { password, ...vendorWithoutPassword } = createdVendor;
            return vendorWithoutPassword;

        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('Email already exists');
            }
            throw new InternalServerErrorException('Could not create vendor');
        }
    }

    async findAll(): Promise<Omit<User, 'password'>[]> {
        try {
            const vendors = await this.prisma.user.findMany({
                where: {
                    role: 'VENDOR'
                }
            });
            const vendorsWithoutPassword = vendors.map(vendor => {
                const { password, ...vendorWithoutPassword } = vendor;
                return vendorWithoutPassword;
            });
            return vendorsWithoutPassword;
        }
        catch (error) {
            throw new InternalServerErrorException('Could not retrieve vendors');
        }

    }

    async findOne(id: string): Promise<Omit<User, 'password'>> {
        try{
            const vendor = await this.prisma.user.findUnique({
                where: { id }
            });
            if (!vendor || vendor.role !== 'VENDOR') {
               throw new NotFoundException('Vendor not found');
            }
            const { password, ...vendorWithoutPassword } = vendor;
        return vendorWithoutPassword;
        }
        catch(error){
            if(error instanceof NotFoundException){
                throw error;
            }
            throw new InternalServerErrorException('Could not retrieve vendor');
        }
       
    }

    async updateService(id: string, updateVendorDto: UpdateVendorDto): Promise<{ success: boolean, data: ResponseVendorDto } | { success: boolean, statusCode: number, message: string }> {
        const vendor = await this.prisma.user.findUnique({
            where: { id }
        });
        if (!vendor || vendor.role !== 'VENDOR') {
            return sendError('Vendor not found', 404);
        }
        const updateData: any = {};
        if (updateVendorDto.name) updateData.name = updateVendorDto.name;
        if (updateVendorDto.email) updateData.email = updateVendorDto.email;
        if (updateVendorDto.password) {
            updateData.password = await bcrypt.hash(updateVendorDto.password, 10);
        }
        const updatedVendor = await this.prisma.user.update({
            where: { id },
            data: updateData
        });
        const { password, ...vendorWithoutPassword } = updatedVendor;
        return sendResponse(vendorWithoutPassword);
    }

    async deleteService(id: string): Promise<{ success: boolean, data: { message: string } } | { success: boolean, statusCode: number, message: string }> {
        const vendor = await this.prisma.user.findUnique({
            where: { id }
        });
        if (!vendor || vendor.role !== 'VENDOR') {
            return sendError('Vendor not found', 404);
        }
        await this.prisma.user.delete({ where: { id } });
        return sendResponse({ message: 'Vendor deleted successfully' });
    }
}

