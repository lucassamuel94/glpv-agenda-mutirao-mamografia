import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';

export class CreateClinicDto {
  @IsUUID()
  organizationId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  capacity: number;

  @IsString()
  @MinLength(2)
  address: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  whatsapp?: string;
}
