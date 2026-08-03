import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

/**
 * `confirmed` is optional: RN-42 says a negative answer, silence/timeout, or
 * an unrecognized reply must all keep the appointment — only an explicit
 * `true` cancels. The EZ Chat integration omits the field for timeout/
 * unrecognized replies instead of guessing a boolean.
 */
export class AbsenceConfirmationDto {
  @ApiProperty() @IsUUID() appointmentId: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() confirmed?: boolean;
}
