import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

/**
 * Filtros de listagem do relatório — exemplo de referência do template.
 * Mesmo shape das listagens CRM que este módulo substituiu (page/limit/
 * search/sortBy/sortOrder + filtros de domínio): copie este DTO ao criar
 * um novo módulo de listagem.
 */
export class ListReportsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  /** Busca livre em `entity`/`action`. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['allowed', 'denied'] })
  @IsOptional()
  @IsIn(['allowed', 'denied'])
  outcome?: 'allowed' | 'denied';

  @ApiPropertyOptional({ description: 'Nome da entidade auditada (ex.: "user", "organization")' })
  @IsOptional()
  @IsString()
  entity?: string;

  /** ISO 8601 — início do período (inclusive). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateFrom?: string;

  /** ISO 8601 — fim do período (inclusive). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: ['created_at', 'outcome', 'entity'] })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}
