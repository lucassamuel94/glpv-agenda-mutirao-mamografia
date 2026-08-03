import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { CancellationReason } from '../../../entities';

/** RN-35: every cancellation needs a typed reason — no free-text. */
export class CancelAppointmentDto {
  @ApiProperty({ enum: CancellationReason })
  @IsIn(Object.values(CancellationReason))
  reason: CancellationReason;
}
