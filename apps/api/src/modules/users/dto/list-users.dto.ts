import { IsOptional, IsEnum, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { UserRole } from '../../../common/enums/user-role.enum';

/**
 * DTO para listagem de usuários com filtros
 * Estende PaginationDto com filtros específicos de usuários
 */
export class ListUsersDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtrar por role do usuário',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role deve ser válido' })
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Filtrar por nome do usuário',
    example: 'João Silva',
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por email do usuário',
    example: 'joao@exemplo.com',
  })
  @IsOptional()
  @IsString({ message: 'Email deve ser uma string' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID da organização',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID da organização deve ser um UUID válido' })
  organization_id?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do usuário que criou',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID do criador deve ser um UUID válido' })
  created_by?: string;
}
