import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateAdminDto } from "./dtos/create-admin.dto";
import { ResponseAdminDto } from "./dtos/response-sdmin.dto";
import { UpdateAdminDto } from "./dtos/update-admin.dto";
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createAdminDto: CreateAdminDto): Promise<ResponseAdminDto> {
        try {
            const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);
            const createdAdmin = await this.prisma.user.create({
                data: {
                    name: createAdminDto.name,
                    email: createAdminDto.email,
                    password: hashedPassword,
                    role: 'ADMIN'
                }
            })

            return {
                    id: createdAdmin.id,
                    name: createdAdmin.name,
                    email: createdAdmin.email,
                    role: createdAdmin.role,
                    createdAt: createdAdmin.createdAt,
                    updatedAt: createdAdmin.updatedAt
            }

        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('Email already exists');
            }
            throw new InternalServerErrorException('Could not create admin');
        }
    }

    async findAll(): Promise<ResponseAdminDto[]> {
        const admins = await this.prisma.user.findMany({
            where: {
                role: 'ADMIN'
            }
        });
        return admins.map(admin => ({
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            createdAt: admin.createdAt,
            updatedAt: admin.updatedAt
        }));
    }

    async findOne(id: string): Promise<ResponseAdminDto> {
        const admin = await this.prisma.user.findUnique({
            where: { id }
        });
        if (!admin || admin.role !== 'ADMIN') {
            throw new NotFoundException('Admin not found');
        }
        return {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            createdAt: admin.createdAt,
            updatedAt: admin.updatedAt  
        }
    }

    async updateService(id: string, updateAdminDto: UpdateAdminDto): Promise<ResponseAdminDto> {
        const admin = await this.prisma.user.findUnique({
            where: { id }
        });
        if (!admin || admin.role !== 'ADMIN') {
            throw new NotFoundException('Admin not found');
        }
        const updateData: any = {};
        if (updateAdminDto.name) updateData.name = updateAdminDto.name;
        if (updateAdminDto.email) updateData.email = updateAdminDto.email;
        if (updateAdminDto.password) {
            updateData.password = await bcrypt.hash(updateAdminDto.password, 10);
        }
        const updatedAdmin = await this.prisma.user.update({
            where: { id },
            data: updateData
        });
        return {
            id: updatedAdmin.id,
            name: updatedAdmin.name,
            email: updatedAdmin.email,
            role: updatedAdmin.role,
            createdAt: updatedAdmin.createdAt,
            updatedAt: updatedAdmin.updatedAt
        }
    }

    async deleteService(id: string): Promise<void> {
        const admin = await this.prisma.user.findUnique({
            where: { id }
        });
        if (!admin || admin.role !== 'ADMIN') {
            throw new NotFoundException('Admin not found');
        }
        await this.prisma.user.delete({ where: { id } });
    }
}

