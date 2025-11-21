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
            const createdVendor = await this.prisma.vendor.create({
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
        const vendors = await this.prisma.vendor.findMany();
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
        const vendor = await this.prisma.vendor.findUnique({
            where: { id }
        });
        if (!vendor) {
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
        const vendor = await this.prisma.vendor.findUnique({
            where: { id }
        });
        if (!vendor) {
            throw new NotFoundException('Vendor not found');
        }
        if (updateVendorDto.password) {
            updateVendorDto.password = await bcrypt.hash(updateVendorDto.password, 10);
        }
        const updatedVendor = await this.prisma.vendor.update({
            where: { id },
            data: updateVendorDto
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
        const vendor = await this.prisma.vendor.findUnique({
            where: { id }
        });
        if (!vendor) {
            throw new NotFoundException('Vendor not found');
        }
        await this.prisma.vendor.delete({ where: { id } });
    }
}

