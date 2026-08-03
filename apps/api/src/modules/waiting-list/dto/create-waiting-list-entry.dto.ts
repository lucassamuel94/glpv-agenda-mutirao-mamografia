import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateWaitingListEntryDto {
  @ApiProperty() @IsUUID() patient_id: string;
  @ApiProperty() @IsString() @MaxLength(32) phone: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(32) alt_phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
