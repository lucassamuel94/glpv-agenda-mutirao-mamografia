import { IsString, IsNotEmpty, IsEmail, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from '../../../common/validators/password.validator';

/** Roles permitidos para novo usuário SA (não inclui SUPER_ADMIN) */
export enum SaRole {
  SA_MASTER = 'SA_MASTER',
  SA_BILLING = 'SA_BILLING',
  SA_USER = 'SA_USER',
}

export class CreateSaUserDto {
  @ApiProperty({ example: 'Nome do SA' })
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  name: string;

  @ApiProperty({ example: 'sa@example.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @IsStrongPassword()
  password: string;

  @ApiProperty({
    description: 'Sub-permissão do Super Admin',
    enum: SaRole,
    example: SaRole.SA_MASTER,
  })
  @IsEnum(SaRole, { message: 'super_admin_role deve ser SA_MASTER, SA_BILLING ou SA_USER' })
  super_admin_role: SaRole;
}
