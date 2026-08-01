import { Global, Module } from '@nestjs/common';
import { QuotaService } from '../services/quota.service';

@Global()
@Module({
  providers: [QuotaService],
  exports: [QuotaService],
})
export class QuotaModule {}
