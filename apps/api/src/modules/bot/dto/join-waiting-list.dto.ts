import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

/** RN-43: offered right after a bot-driven cancellation (absence/withdrawal). */
export class JoinWaitingListDto {
  @ApiProperty() @IsString() @MaxLength(255) fullName: string;
  @ApiProperty({ example: '1975-04-12' }) @IsDateString() birthDate: string;
  @ApiProperty() @IsString() @MaxLength(32) phone: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(32) altPhone?: string;
}
