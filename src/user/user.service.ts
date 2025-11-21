import {
    Injectable
} from "@nestjs/common";
import { CreateUserDto } from "./dtos/create-user.dto";
import { UserResponseDto } from "./dtos/user-response.dto";
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
    private users: UserResponseDto[] = [];
    create(createUserDto: CreateUserDto) {
        const newUser = {
            id: uuidv4(), ...createUserDto, role: "USER", createdAt: new Date(),
            updatedAt: new Date()
        };
        this.users.push(newUser);

        const userResponse: UserResponseDto = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt,
        }
        return userResponse;
    }
}