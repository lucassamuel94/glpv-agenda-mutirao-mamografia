import { IsString, IsEmail, MinLength, IsOptional, Matches, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsStrongPassword } from '../../common/validators/password.validator';

/**
 * DTO para solicitação de acesso / registro (empresa + usuário).
 * Alinhado com o formulário do frontend (request-access).
 */
export class RegisterDto {
  @ApiProperty({ example: 'Carlos Silva', description: 'Nome completo do responsável' })
  @IsString()
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  name: string;

  @ApiProperty({ example: 'carlos@empresa.com', description: 'E-mail corporativo' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({
    example: 'SenhaForte123',
    description: 'Senha (mínimo 8 caracteres, com maiúscula, minúscula e número)',
    minLength: 8,
  })
  @IsStrongPassword()
  password: string;

  @ApiProperty({ example: 'Minha Empresa Ltda', description: 'Nome da empresa' })
  @IsString()
  @MinLength(2, { message: 'Nome da empresa deve ter pelo menos 2 caracteres' })
  organization_name: string;

  @ApiProperty({ example: '12.345.678/0001-90', description: 'CNPJ (14 dígitos ou formatado)' })
  @IsString()
  @MinLength(14, { message: 'CNPJ deve conter 14 dígitos' })
  cnpj: string;

  @ApiPropertyOptional({ example: 'Rua Exemplo, 100', description: 'Endereço da empresa' })
  @IsOptional()
  @IsString()
  organization_address?: string;

  @ApiPropertyOptional({ description: 'URL do logo principal' })
  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/|data:image\/)/, { message: 'Imagem do logo inválida' })
  logo_url?: string;

  @ApiPropertyOptional({ description: 'URL do ícone da marca' })
  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/|data:image\/)/, { message: 'Imagem do ícone inválida' })
  icon_url?: string;

  @ApiPropertyOptional({ description: 'URL do favicon' })
  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/|data:image\/)/, { message: 'Imagem do favicon inválida' })
  favicon_url?: string;

  @ApiPropertyOptional({ example: '#4f46e5' })
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  primary_color?: string;

  @ApiPropertyOptional({ example: '#312e81' })
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  secondary_color?: string;

  @ApiPropertyOptional({ enum: ['light', 'dark', 'system'], default: 'light' })
  @IsOptional()
  @IsIn(['light', 'dark', 'system'])
  theme?: string;

  @ApiPropertyOptional({ enum: ['compact', 'comfortable', 'spacious'], default: 'compact' })
  @IsOptional()
  @IsIn(['compact', 'comfortable', 'spacious'])
  density?: string;

  @ApiPropertyOptional({ example: 'pt-BR', default: 'pt-BR' })
  @IsOptional()
  @IsIn(['pt-BR'])
  locale?: string;

  @ApiPropertyOptional({ example: 'America/Sao_Paulo', default: 'America/Sao_Paulo' })
  @IsOptional()
  @IsIn(['America/Sao_Paulo'])
  timezone?: string;

  @ApiPropertyOptional({ example: 'DD/MM/YYYY', default: 'DD/MM/YYYY' })
  @IsOptional()
  @IsIn(['DD/MM/YYYY'])
  date_format?: string;
}
