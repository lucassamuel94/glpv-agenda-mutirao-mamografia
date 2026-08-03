import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsUUID } from 'class-validator';

/** RN-32: attendant already resolved the patient via POST /patients/search. */
export class ManualBookingDto {
  @ApiProperty() @IsUUID() slotId: string;
  @ApiProperty() @IsUUID() patientId: string;
  @ApiProperty({ example: '1975-04-12' }) @IsDateString() birthDate: string;
  @ApiProperty() @IsBoolean() hasMammographyWithin12Months: boolean;
}
