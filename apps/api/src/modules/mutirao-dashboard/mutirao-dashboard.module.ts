import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { MutiraoDashboardRepository } from '../../repositories/mutirao-dashboard.repository';
import { MutiraoDashboardController } from './mutirao-dashboard.controller';
import { MutiraoDashboardService } from './mutirao-dashboard.service';

@Module({
  imports: [AuthModule],
  controllers: [MutiraoDashboardController],
  providers: [MutiraoDashboardService, MutiraoDashboardRepository],
})
export class MutiraoDashboardModule {}
