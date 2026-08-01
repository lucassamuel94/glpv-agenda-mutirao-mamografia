import { IsString, MinLength, IsOptional, IsEnum, Matches, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationStatus } from '../../../entities/organization.entity';

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'Minha Empresa Ltda', description: 'Nome da organização' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  name?: string;

  @ApiPropertyOptional({
    example: '12.345.678/0001-90',
    description: 'CNPJ (14 dígitos ou formatado)',
  })
  @IsOptional()
  @IsString()
  @MinLength(14, { message: 'CNPJ deve conter 14 dígitos' })
  cnpj?: string;

  @ApiPropertyOptional({ example: 'Rua Exemplo, 100', description: 'Endereço da organização' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Status da organização', enum: OrganizationStatus })
  @IsOptional()
  @IsEnum(OrganizationStatus, { message: 'Status inválido' })
  status?: OrganizationStatus;

  @ApiPropertyOptional({
    example: '#4f46e5',
    description: 'Cor primária da marca (whitelabel), formato hex (#rrggbb)',
  })
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'Cor primária deve estar no formato #rrggbb' })
  primary_color?: string;

  @ApiPropertyOptional({ description: 'URL do logo da organização (whitelabel)' })
  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/|data:image\/)/, { message: 'Imagem do logo inválida' })
  logo_url?: string;

  @ApiPropertyOptional({ description: 'URL do ícone da organização' })
  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/|data:image\/)/, { message: 'Imagem do ícone inválida' })
  icon_url?: string;

  @ApiPropertyOptional({ description: 'URL do favicon da organização (whitelabel)' })
  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/|data:image\/)/, { message: 'Imagem do favicon inválida' })
  favicon_url?: string;

  @ApiPropertyOptional({ example: '#312e81' })
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'Cor secundária deve estar no formato #rrggbb' })
  secondary_color?: string;

  @ApiPropertyOptional({ enum: ['light', 'dark', 'system'] })
  @IsOptional()
  @IsIn(['light', 'dark', 'system'])
  theme?: string;

  @ApiPropertyOptional({ enum: ['compact', 'comfortable', 'spacious'] })
  @IsOptional()
  @IsIn(['compact', 'comfortable', 'spacious'])
  density?: string;

  @ApiPropertyOptional({ enum: ['pt-BR'] })
  @IsOptional()
  @IsIn(['pt-BR'])
  locale?: string;

  @ApiPropertyOptional({ enum: ['America/Sao_Paulo'] })
  @IsOptional()
  @IsIn(['America/Sao_Paulo'])
  timezone?: string;

  @ApiPropertyOptional({ enum: ['DD/MM/YYYY'] })
  @IsOptional()
  @IsIn(['DD/MM/YYYY'])
  date_format?: string;
}
