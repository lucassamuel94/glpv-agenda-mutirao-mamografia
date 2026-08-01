import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/user-role.enum';

/**
 * DTO para vincular usuário existente à empresa por e-mail (convite).
 * Usuário deve já estar cadastrado no sistema.
 */
export class InviteUserDto {
  @ApiProperty({
    description: 'E-mail do usuário a vincular (deve já estar cadastrado)',
    example: 'colaborador@empresa.com',
  })
  @IsEmail({}, { message: 'E-mail inválido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  email: string;

  @ApiProperty({
    description: 'Função do usuário na empresa',
    enum: UserRole,
    example: UserRole.COORDINATOR,
  })
  @IsEnum(UserRole, { message: 'Função inválida' })
  @IsNotEmpty({ message: 'A função é obrigatória' })
  role: UserRole;
}
