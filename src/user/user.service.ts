import {
    Injectable, ConflictException, InternalServerErrorException, NotFoundException
} from "@nestjs/common";
import { CreateUserDto } from "./dtos/create-user.dto";
import { UpdateUserDto } from "./dtos/update-user.dto";
import { UserResponseDto } from "./dtos/user-response.dto";
import { PrismaService } from "src/prisma/prisma.service";
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {

    constructor(private readonly prisma: PrismaService) { }


    async create(createUserDto: CreateUserDto) {
        try {
            const hashedPassword = await bcrypt.hash(createUserDto.password, 10);


            const createdUser = await this.prisma.user.create({
                data: {
                    name: createUserDto.name,
                    email: createUserDto.email,
                    password: hashedPassword,
                    role: "USER",
                }
            })

            const userResponse: UserResponseDto = {
                id: createdUser.id,
                name: createdUser.name,
                email: createdUser.email,
                role: createdUser.role,
                createdAt: createdUser.createdAt,
                updatedAt: createdUser.updatedAt,
            }
            return userResponse;
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('Email already exists');
            }
            throw new InternalServerErrorException('Could not create user');
        }

    }

    async findAll(): Promise<UserResponseDto[]> {
        const users = await this.prisma.user.findMany();
        return users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }));
    }

    async findOne(id: string): Promise<UserResponseDto> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async updateService(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const dataToUpdate: { name?: string; email?: string; password?: string } = {
            name: updateUserDto.name,
            email: updateUserDto.email,
        }
        if (updateUserDto.password) {
            dataToUpdate.password = await bcrypt.hash(updateUserDto.password, 10);
        }

        const updateUser = await this.prisma.user.update({
            where: { id },
            data: dataToUpdate
        })
        const { password, ...userWithoutPassword } = updateUser;
        return userWithoutPassword;
    }
}