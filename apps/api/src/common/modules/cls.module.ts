import { Module, Global } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { RequestContextService } from '../services/cls.service';

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req) => {
          // Configuração inicial do contexto CLS
          cls.set(
            'requestId',
            req.headers['x-request-id'] || Math.random().toString(36).substring(7)
          );
        },
      },
    }),
  ],
  providers: [RequestContextService],
  exports: [RequestContextService],
})
export class ClsContextModule {}
