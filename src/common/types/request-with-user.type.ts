import { Request } from 'express';
import { UserPayload } from './user-payload.type';

export interface RequestWithUser extends Request {  
    user: UserPayload;
}