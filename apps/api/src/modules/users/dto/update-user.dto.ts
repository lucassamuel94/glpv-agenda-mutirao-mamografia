import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para atualização de um usuário
 * Todos os campos são opcionais
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    description: 'Hash do usuário',
    example: 'abc123def456',
  })
  @IsOptional()
  @IsString({ message: 'Hash deve ser uma string' })
  hash?: string;

  @ApiPropertyOptional({
    description: 'Configurações do usuário',
    example: {
      defaultTheme: 'dark',
      notifications: false,
      sounds: true,
    },
  })
  @IsOptional()
  @IsObject({ message: 'Configurações devem ser um objeto' })
  @ValidateNested()
  @Type(() => Object)
  settings?: {
    defaultTheme: string;
    notifications: boolean;
    sounds: boolean;
  };

  @ApiPropertyOptional({
    description: 'ID do usuário que criou este usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString({ message: 'ID do criador deve ser uma string' })
  created_by?: string;
}
