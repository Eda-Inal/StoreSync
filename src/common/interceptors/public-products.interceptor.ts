import { Injectable, NestInterceptor, ExecutionContext,CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { sendResponse } from 'src/helper/response.helper';

@Injectable()
export class PublicProductsResponseInterceptor implements NestInterceptor {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                // delete 
                if (data === undefined || data === null) {
                    return data;
                }

                return sendResponse(data);
            }),
        );
    }
}
