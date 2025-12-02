import { Injectable, ConflictException, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateAdminDto } from "./dtos/create-admin.dto";
import { UpdateAdminDto } from "./dtos/update-admin.dto";
import * as bcrypt from 'bcrypt';
import { User } from "generated/prisma";

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createAdminDto: CreateAdminDto): Promise<Omit<User, 'password'>> {
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

            const { password, ...adminWithoutPassword } = createdAdmin;
            return adminWithoutPassword;

        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('Email already exists');
            }
            throw new InternalServerErrorException('Failed to create admin');
        }
    }


    async findOne(id: string): Promise<Omit<User, 'password'>> {
        try {
            const admin = await this.prisma.user.findUnique({
                where: { id }
            });
            if (!admin || admin.role !== 'ADMIN') {
                throw new NotFoundException('Admin not found');
            }
            const { password, ...adminWithoutPassword } = admin;
            return adminWithoutPassword;
        }
        catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to retrieve admin');
        }
    }

    async updateService(id: string, updateAdminDto: UpdateAdminDto): Promise<Omit<User, 'password'>> {
        try {
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
            const { password, ...adminWithoutPassword } = updatedAdmin;
            return adminWithoutPassword;
        }
        catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to update admin');
        }
    }

}

