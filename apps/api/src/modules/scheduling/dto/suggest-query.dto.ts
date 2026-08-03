import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { SlotPeriod } from '../../../common/enums/slot-period.enum';

export class SuggestQueryDto {
  @ApiProperty({ example: '2026-09-08' }) @IsDateString() from: string;
  @ApiProperty({ example: '2026-10-30' }) @IsDateString() to: string;

  @ApiPropertyOptional({ enum: SlotPeriod })
  @IsOptional()
  @IsEnum(SlotPeriod)
  period?: SlotPeriod;

  @ApiPropertyOptional({ default: 3, minimum: 1, maximum: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit?: number;
}
