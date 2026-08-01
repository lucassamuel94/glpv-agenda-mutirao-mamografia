import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/user-role.enum';

/**
 * DTO para atualização de role de usuário
 */
export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'Novo role do usuário na empresa',
    enum: UserRole,
    example: UserRole.MANAGER,
  })
  @IsEnum(UserRole, { message: 'Role deve ser um valor válido' })
  @IsNotEmpty({ message: 'Role é obrigatório' })
  role: UserRole;
}
