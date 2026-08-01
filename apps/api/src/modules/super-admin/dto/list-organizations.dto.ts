import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { OrganizationStatus } from '../../../entities/organization.entity';

/**
 * DTO da listagem de organizações do console SA.
 *
 * Herda page/limit/search/sortBy/sortOrder de `PaginationDto`. As colunas
 * ordenáveis são resolvidas por allowlist no `OrganizationRepository` — um
 * `sortBy` fora dela cai no default em silêncio (ver `common/domain/list-sort.ts`).
 */
export class ListOrganizationsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtrar por status da organização',
    enum: OrganizationStatus,
    example: OrganizationStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(OrganizationStatus, { message: 'Status deve ser válido' })
  status?: OrganizationStatus;
}
