import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsUUID } from 'class-validator';

export class ReminderResponseDto {
  @ApiProperty() @IsUUID() appointmentId: string;
  @ApiProperty({ description: 'true = "não poderei comparecer"' }) @IsBoolean() absent: boolean;
}
