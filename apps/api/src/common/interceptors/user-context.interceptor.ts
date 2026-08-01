import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestContextService } from '../services/cls.service';

@Injectable()
export class UserContextInterceptor implements NestInterceptor {
  constructor(private readonly requestContextService: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Se existe um usuário autenticado na requisição, armazena no contexto CLS
    if (user) {
      this.requestContextService.setUserContext(user);
    }

    return next.handle();
  }
}
