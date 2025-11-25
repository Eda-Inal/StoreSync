import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateVendorDto } from "./dtos/create-vendor.dto";
import { ResponseVendorDto } from "./dtos/response-vendor.dto";
import { UpdateVendorDto } from "./dtos/update-vendor.dto";
import * as bcrypt from 'bcrypt';
import { sendResponse, sendError } from "src/helper/response.helper";

@Injectable()
export class VendorService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createVendorDto: CreateVendorDto): Promise<{success: boolean, data: ResponseVendorDto} | {success: boolean, statusCode: number, message: string}> {
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

            const vendorResponse: ResponseVendorDto = {
                id: createdVendor.id,
                name: createdVendor.name,
                email: createdVendor.email,
                role: createdVendor.role,
                createdAt: createdVendor.createdAt,
                updatedAt: createdVendor.updatedAt
            }
            return sendResponse(vendorResponse);

        }
        catch (error) {
            if (error.code === 'P2002') {
                return sendError('Email already exists', 409);
            }
            return sendError('Could not create vendor', 500);
        }
    }

    async findAll(): Promise<{success: boolean, data: ResponseVendorDto[]}> {
        const vendors = await this.prisma.user.findMany({
            where: {
                role: 'VENDOR'
            }
        });
        const vendorsWithoutPassword = vendors.map(vendor => {
            const { password, ...vendorWithoutPassword } = vendor;
            return vendorWithoutPassword;
        });
        return sendResponse(vendorsWithoutPassword);
    }

    async findOne(id: string): Promise<{success: boolean, data: ResponseVendorDto} | {success: boolean, statusCode: number, message: string}> {
        const vendor = await this.prisma.user.findUnique({
            where: { id }
        });
        if (!vendor || vendor.role !== 'VENDOR') {
            return sendError('Vendor not found', 404);
        }
        const { password, ...vendorWithoutPassword } = vendor;
        return sendResponse(vendorWithoutPassword);
    }

    async updateService(id: string, updateVendorDto: UpdateVendorDto): Promise<{success: boolean, data: ResponseVendorDto} | {success: boolean, statusCode: number, message: string}> {
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

    async deleteService(id: string): Promise<{success: boolean, data: {message: string}} | {success: boolean, statusCode: number, message: string}> {
        const vendor = await this.prisma.user.findUnique({
            where: { id }
        });
        if (!vendor || vendor.role !== 'VENDOR') {
            return sendError('Vendor not found', 404);
        }
        await this.prisma.user.delete({ where: { id } });
        return sendResponse({message: 'Vendor deleted successfully'});
    }
}

