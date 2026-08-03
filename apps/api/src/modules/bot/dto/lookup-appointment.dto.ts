import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, Length } from 'class-validator';

/** RN-31: protocol lookup always requires both fields — never protocol alone. */
export class LookupAppointmentDto {
  @ApiProperty({ example: 'AB23CD' }) @Length(6, 6) protocol: string;
  @ApiProperty({ example: '1975-04-12' }) @IsDateString() birthDate: string;
}
