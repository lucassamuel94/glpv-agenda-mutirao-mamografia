import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOfferDto {
  @ApiProperty({ description: 'Id da conversa no EZ Chat' }) @IsString() conversationId: string;
  @ApiProperty() @IsString() @MaxLength(255) fullName: string;
  @ApiProperty({ example: '1975-04-12' }) @IsDateString() birthDate: string;
  @ApiProperty() @IsString() @MaxLength(32) phone: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(32) altPhone?: string;
  @ApiProperty() @IsBoolean() hasMammographyWithin12Months: boolean;
}
