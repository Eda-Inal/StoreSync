import {
    Injectable,
    ConflictException,
    InternalServerErrorException,
    NotFoundException,
} from "@nestjs/common";
import { CreateUserDto } from "./dtos/create-user.dto";
import { UpdateUserDto } from "./dtos/update-user.dto";
import { UserResponseDto } from "./dtos/user-response.dto";
import { PrismaService } from "src/prisma/prisma.service";
import * as bcrypt from 'bcrypt';
import { sendResponse, sendError } from "src/helper/response.helper"
import { User } from "generated/prisma";

@Injectable()
export class UserService {

    constructor(private readonly prisma: PrismaService) { }

    async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
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
            const { password, ...userWithoutPassword } = createdUser;
            return userWithoutPassword;
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('Email already exists');
            }
            throw new InternalServerErrorException('Could not create user');
        }

    }

    async findAll(): Promise<Omit<User, 'password'>[]> {
        try {
            const users = await this.prisma.user.findMany();
            const usersWithoutPassword = users.map((user) => {
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });
            return usersWithoutPassword;
        }
        catch (error) {
            throw new InternalServerErrorException('Failed to retrieve users.');
        }
    }

    async findOne(id: string): Promise<Omit<User, 'password'>> {
        try {
            const user = await this.prisma.user.findUnique({ where: { id } });
            if (!user) {
                throw new NotFoundException('User not found');

            }
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to retrieve user.');
        }

    }

    async updateService(id: string, updateUserDto: UpdateUserDto): Promise<Omit<User, 'password'>> {
        try {
          const user = await this.prisma.user.findUnique({ where: { id } });
          if (!user) {
            throw new NotFoundException('User not found');
          }
      
          const hashedPassword = await bcrypt.hash(updateUserDto.password ?? user.password, 10);
      
          const updatedUser = await this.prisma.user.update({
            where: { id },
            data: {
              name: updateUserDto.name,
              email: updateUserDto.email,
              password: hashedPassword,
            },
          });
      
          const { password, ...userWithoutPassword } = updatedUser;
          return userWithoutPassword;
      
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }
          if (error.code === 'P2002') {
            throw new ConflictException('Email already exists');
          }
          throw new InternalServerErrorException('Failed to update user.');
        }
      }
      

    async deleteService(id: string): Promise<void> {
        try {
            const user = await this.prisma.user.findUnique({ where: { id } });
            if (!user) {
                throw new NotFoundException('User not found');
            }
            await this.prisma.user.delete({ where: { id } });
        }
        catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to delete user.');
        }

    }
}