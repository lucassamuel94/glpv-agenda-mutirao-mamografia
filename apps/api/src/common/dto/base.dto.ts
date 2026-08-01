import { IsOptional, IsNumber, IsString, IsBoolean, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO base com validações comuns
 */
export class BaseDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  organization_id?: number;

  @IsOptional()
  @IsDateString()
  created_at?: string;

  @IsOptional()
  @IsDateString()
  updated_at?: string;
}

/**
 * DTO base para listagem com paginação
 */
export class BaseListDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'created_at';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

/**
 * DTO base para filtros de status
 */
export class BaseStatusDto extends BaseListDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  active?: boolean;
}
