import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateAdminDto } from "./dtos/create-admin.dto";
import { ResponseAdminDto } from "./dtos/response-sdmin.dto";
import { UpdateAdminDto } from "./dtos/update-admin.dto";
import * as bcrypt from 'bcrypt';
import { sendResponse, sendError } from "src/helper/response.helper";

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createAdminDto: CreateAdminDto): Promise<{success: boolean, data: ResponseAdminDto} | {success: boolean, statusCode: number, message: string}> {
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

            const adminResponse: ResponseAdminDto = {
                id: createdAdmin.id,
                name: createdAdmin.name,
                email: createdAdmin.email,
                role: createdAdmin.role,
                createdAt: createdAdmin.createdAt,
                updatedAt: createdAdmin.updatedAt
            }
            return sendResponse(adminResponse);

        }
        catch (error) {
            if (error.code === 'P2002') {
                return sendError('Email already exists', 409);
            }
            return sendError('Could not create admin', 500);
        }
    }

    async findAll(): Promise<{success: boolean, data: ResponseAdminDto[]}> {
        const admins = await this.prisma.user.findMany({
            where: {
                role: 'ADMIN'
            }
        });
        const adminsWithoutPassword = admins.map(admin => {
            const { password, ...adminWithoutPassword } = admin;
            return adminWithoutPassword;
        });
        return sendResponse(adminsWithoutPassword);
    }

    async findOne(id: string): Promise<{success: boolean, data: ResponseAdminDto} | {success: boolean, statusCode: number, message: string}> {
        const admin = await this.prisma.user.findUnique({
            where: { id }
        });
        if (!admin || admin.role !== 'ADMIN') {
            return sendError('Admin not found', 404);
        }
        const { password, ...adminWithoutPassword } = admin;
        return sendResponse(adminWithoutPassword);
    }

    async updateService(id: string, updateAdminDto: UpdateAdminDto): Promise<{success: boolean, data: ResponseAdminDto} | {success: boolean, statusCode: number, message: string}> {
        const admin = await this.prisma.user.findUnique({
            where: { id }
        });
        if (!admin || admin.role !== 'ADMIN') {
            return sendError('Admin not found', 404);
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
        const { password, ...adminWithoutPassword } = updatedAdmin;
        return sendResponse(adminWithoutPassword);
    }

    async deleteService(id: string): Promise<{success: boolean, data: {message: string}} | {success: boolean, statusCode: number, message: string}> {
        const admin = await this.prisma.user.findUnique({
            where: { id }
        });
        if (!admin || admin.role !== 'ADMIN') {
            return sendError('Admin not found', 404);
        }
        await this.prisma.user.delete({ where: { id } });
        return sendResponse({message: 'Admin deleted successfully'});
    }
}

