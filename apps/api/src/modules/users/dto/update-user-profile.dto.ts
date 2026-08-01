import {
  IsString,
  IsOptional,
  MinLength,
  IsObject,
  ValidateNested,
  IsIn,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  UserPreferences,
  DateRangePreset,
  ThemePreference,
} from '../../../common/interfaces/user-preferences.interface';
import { IsStrongPassword } from '../../../common/validators/password.validator';

class UserPreferencesDto {
  @ApiPropertyOptional({
    description: 'Range padrão de datas para consultas',
    example: 'last30',
    enum: [
      'today',
      'yesterday',
      'last7',
      'last14',
      'last30',
      'thisWeek',
      'lastWeek',
      'thisMonth',
      'lastMonth',
    ],
    nullable: true,
  })
  @IsOptional()
  @IsIn(
    [
      'today',
      'yesterday',
      'last7',
      'last14',
      'last30',
      'thisWeek',
      'lastWeek',
      'thisMonth',
      'lastMonth',
      null,
    ],
    {
      message: 'defaultDateRange deve ser um preset válido ou null',
    }
  )
  defaultDateRange?: DateRangePreset | null;

  @ApiPropertyOptional({
    description: 'Tema preferido pelo usuário',
    example: 'dark',
    enum: ['light', 'dark', 'system'],
  })
  @IsOptional()
  @IsIn(['light', 'dark', 'system'], {
    message: "theme deve ser 'light', 'dark' ou 'system'",
  })
  theme?: ThemePreference;

  @ApiPropertyOptional({
    description: 'Cor primária escolhida pelo usuário para a interface (hex)',
    example: '#4f46e5',
    nullable: true,
  })
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, {
    message: 'primaryColor deve ser um hex válido, ex: #4f46e5',
  })
  primaryColor?: string | null;
}

export class UpdateUserProfileDto {
  @ApiPropertyOptional({
    description: 'Nome completo do usuário',
    example: 'João Silva',
    minLength: 2,
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Nova senha (mínimo 8 caracteres, com maiúscula, minúscula e número)',
    example: 'NovaSenha123',
    minLength: 8,
  })
  @IsOptional()
  @IsStrongPassword()
  newPassword?: string;

  @ApiPropertyOptional({
    description: 'Preferências do usuário',
    type: UserPreferencesDto,
  })
  @IsOptional()
  @IsObject({ message: 'preferences deve ser um objeto' })
  @ValidateNested()
  @Type(() => UserPreferencesDto)
  preferences?: UserPreferences;

  @ApiPropertyOptional({
    description: 'URL (ou data URI) da foto de perfil',
  })
  @IsOptional()
  @IsString({ message: 'avatarUrl deve ser uma string' })
  avatarUrl?: string;
}
