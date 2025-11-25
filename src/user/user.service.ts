import {
    Injectable
} from "@nestjs/common";
import { CreateUserDto } from "./dtos/create-user.dto";
import { UpdateUserDto } from "./dtos/update-user.dto";
import { UserResponseDto } from "./dtos/user-response.dto";
import { PrismaService } from "src/prisma/prisma.service";
import * as bcrypt from 'bcrypt';
import { sendResponse, sendError } from "src/helper/response.helper";

@Injectable()
export class UserService {

    constructor(private readonly prisma: PrismaService) { }


    async create(createUserDto: CreateUserDto): Promise<{success: boolean, data: UserResponseDto} | {success: boolean, statusCode: number, message: string}> {
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
            return sendResponse(userResponse);
        }
        catch (error) {
            if (error.code === 'P2002') {
                return sendError('Email already exists', 409);
            }
            return sendError('Could not create user', 500);
        }

    }

    async findAll(): Promise<{success: boolean, data: UserResponseDto[]}> {
        const users = await this.prisma.user.findMany();
        const usersWithoutPassword = users.map((user) => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        return sendResponse(usersWithoutPassword);
    }

    async findOne(id: string): Promise<{success: boolean, data: UserResponseDto} | {success: boolean, statusCode: number, message: string}> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            return sendError('User not found', 404);
        }
        const { password, ...userWithoutPassword } = user;
        return sendResponse(userWithoutPassword);
    }

    async updateService(id: string, updateUserDto: UpdateUserDto): Promise<{success: boolean, data: UserResponseDto} | {success: boolean, statusCode: number, message: string}> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            return sendError('User not found', 404);
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
        return sendResponse(userWithoutPassword);
    }

    async deleteService(id:string): Promise<{success: boolean, data: {message: string}} | {success: boolean, statusCode: number, message: string}> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if(!user){
            return sendError('User not found', 404);
        }
        await this.prisma.user.delete({where: {id}});
        return sendResponse({message: 'User deleted successfully'});
    }
}