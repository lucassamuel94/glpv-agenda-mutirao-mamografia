import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID } from 'class-validator';

export class SlotGridQueryDto {
  @ApiProperty() @IsUUID() clinicId: string;
  @ApiProperty({ example: '2026-09-08' }) @IsDateString() date: string;
}
