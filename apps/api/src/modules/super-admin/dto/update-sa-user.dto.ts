import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SaRole } from './create-sa-user.dto';
import { IsStrongPassword } from '../../../common/validators/password.validator';

export class UpdateSaUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  email?: string;

  @ApiPropertyOptional({ enum: SaRole })
  @IsOptional()
  @IsEnum(SaRole)
  super_admin_role?: SaRole;

  @ApiPropertyOptional({ minLength: 8 })
  @IsOptional()
  @IsStrongPassword()
  new_password?: string;
}
