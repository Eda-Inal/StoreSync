import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateVendorDto } from "./dtos/create-vendor.dto";
import { ResponseVendorDto } from "./dtos/response-vendor.dto";
import { UpdateVendorDto } from "./dtos/update-vendor.dto";
import * as bcrypt from 'bcrypt';

@Injectable()
export class VendorService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createVendorDto: CreateVendorDto): Promise<ResponseVendorDto> {
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

            return {
                id: createdVendor.id,
                name: createdVendor.name,
                email: createdVendor.email,
                role: createdVendor.role,
                createdAt: createdVendor.createdAt,
                updatedAt: createdVendor.updatedAt
            }

        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('Email already exists');
            }
            throw new InternalServerErrorException('Could not create vendor');
        }
    }

    async findAll(): Promise<ResponseVendorDto[]> {
        const vendors = await this.prisma.user.findMany({
            where: {
                role: 'VENDOR'
            }
        });
        return vendors.map(vendor => ({
            id: vendor.id,
            name: vendor.name,
            email: vendor.email,
            role: vendor.role,
            createdAt: vendor.createdAt,
            updatedAt: vendor.updatedAt
        }));
    }

    async findOne(id: string): Promise<ResponseVendorDto> {
        const vendor = await this.prisma.user.findUnique({
            where: { id }
        });
        if (!vendor || vendor.role !== 'VENDOR') {
            throw new NotFoundException('Vendor not found');
        }
        return {
            id: vendor.id,
            name: vendor.name,
            email: vendor.email,
            role: vendor.role,
            createdAt: vendor.createdAt,
            updatedAt: vendor.updatedAt
        }
    }

    async updateService(id: string, updateVendorDto: UpdateVendorDto): Promise<ResponseVendorDto> {
        const vendor = await this.prisma.user.findUnique({
            where: { id }
        });
        if (!vendor || vendor.role !== 'VENDOR') {
            throw new NotFoundException('Vendor not found');
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
        return {
            id: updatedVendor.id,
            name: updatedVendor.name,
            email: updatedVendor.email,
            role: updatedVendor.role,
            createdAt: updatedVendor.createdAt,
            updatedAt: updatedVendor.updatedAt
        }
    }

    async deleteService(id: string): Promise<void> {
        const vendor = await this.prisma.user.findUnique({
            where: { id }
        });
        if (!vendor || vendor.role !== 'VENDOR') {
            throw new NotFoundException('Vendor not found');
        }
        await this.prisma.user.delete({ where: { id } });
    }
}

