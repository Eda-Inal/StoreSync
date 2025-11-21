import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateVendorDto } from "./dtos/create-vendor.dto";
import { ResponseVendorDto } from "./dtos/response-vendor.dto";
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
}

