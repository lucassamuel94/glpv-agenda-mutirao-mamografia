import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { SlotPeriod } from '../../../common/enums/slot-period.enum';

export class AvailabilityQueryDto {
  @ApiProperty({ example: '2026-09-08' }) @IsDateString() from: string;
  @ApiProperty({ example: '2026-10-30' }) @IsDateString() to: string;

  @ApiPropertyOptional({ description: 'Restringe a uma clínica' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ enum: SlotPeriod, description: 'Turno (corte às 12h, hora de parede)' })
  @IsOptional()
  @IsEnum(SlotPeriod)
  period?: SlotPeriod;
}
