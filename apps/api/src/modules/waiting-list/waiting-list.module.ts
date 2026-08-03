import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../auth/auth.module';
import { WaitingListEntry } from '../../entities';
import { WaitingListEntryRepository } from '../../repositories/waiting-list-entry.repository';
import { WaitingListController } from './waiting-list.controller';
import { WaitingListService } from './waiting-list.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([WaitingListEntry], 'master')],
  controllers: [WaitingListController],
  providers: [WaitingListService, WaitingListEntryRepository],
  exports: [WaitingListService],
})
export class WaitingListModule {}
