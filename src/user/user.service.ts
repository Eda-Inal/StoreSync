import {
    Injectable
} from "@nestjs/common";
import { CreateUserDto } from "./dtos/create-user.dto";
import { UserResponseDto } from "./dtos/user-response.dto";
import { PrismaService } from "src/prisma/prisma.service";
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {

constructor(private readonly prisma: PrismaService) {}


   async create(createUserDto: CreateUserDto) {
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

   
       const createdUser = await this.prisma.user.create({
            data: {
             name : createUserDto.name,
             email : createUserDto.email,
             password : hashedPassword,
             role : "USER",
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
}