import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDto } from '../../../common/dto/base.dto';
import { UserRole } from '../../../common/enums/user-role.enum';
import { IsStrongPassword } from '../../../common/validators/password.validator';

export class CreateUserDto extends BaseDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  name: string;

  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'O email é obrigatório' })
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  email: string;

  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @IsStrongPassword()
  password: string;

  @ApiPropertyOptional({
    description: 'Role do usuário na empresa',
    enum: UserRole,
    example: UserRole.COORDINATOR,
    default: UserRole.COORDINATOR,
  })
  @IsEnum(UserRole, { message: 'Role inválido' })
  @IsOptional()
  role?: UserRole = UserRole.COORDINATOR;
}
