import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { IdempotencyRecord } from '../../entities';
import { IdempotencyRecordRepository } from '../../repositories/idempotency-record.repository';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsModule } from '../patients/patients.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { WaitingListModule } from '../waiting-list/waiting-list.module';
import { BotController } from './bot.controller';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([IdempotencyRecord], 'master'),
    SchedulingModule,
    PatientsModule,
    WaitingListModule,
  ],
  controllers: [BotController],
  providers: [IdempotencyRecordRepository, IdempotencyInterceptor],
})
export class BotModule {}
