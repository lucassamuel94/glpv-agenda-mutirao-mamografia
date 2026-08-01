import { IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationStatus } from '../../../entities/organization.entity';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Minha Empresa Ltda', description: 'Nome da organização' })
  @IsString()
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  name: string;

  @ApiProperty({ example: '12.345.678/0001-90', description: 'CNPJ (14 dígitos ou formatado)' })
  @IsString()
  @MinLength(14, { message: 'CNPJ deve conter 14 dígitos' })
  cnpj: string;

  @ApiPropertyOptional({ example: 'Rua Exemplo, 100', description: 'Endereço da organização' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Status inicial da organização',
    enum: OrganizationStatus,
    default: OrganizationStatus.ACTIVATION,
  })
  @IsOptional()
  @IsEnum(OrganizationStatus, { message: 'Status inválido' })
  status?: OrganizationStatus;
}
