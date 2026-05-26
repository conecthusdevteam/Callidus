import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class DateConverterInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map(data => {
                const dateFields = ['createdAt', 'updatedAt'];

                const convertDates = (obj: any) => {
                    if (!obj) return;

                    if (Array.isArray(obj)) {
                        obj.forEach(item => convertDates(item));
                    } else if (typeof obj === 'object') {
                        for (const key of dateFields) {
                            if (obj[key]) {
                                const date = new Date(obj[key]);
                                if (!isNaN(date.getTime())) {
                                    const manausDate = new Date(date.getTime() - 4 * 60 * 60 * 1000);

                                    obj[key] = manausDate.toISOString();
                                }
                            }
                        }
                        for (const key in obj) {
                            if (obj[key] && typeof obj[key] === 'object') {
                                convertDates(obj[key]);
                            }
                        }
                    }
                };

                convertDates(data);
                return data;
            })
        );
    }
}