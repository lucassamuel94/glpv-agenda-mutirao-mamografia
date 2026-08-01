import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrganizationStatus } from '../../../entities/organization.entity';

export class UpdateOrganizationStatusDto {
  @ApiProperty({
    description: 'Novo status da organização',
    enum: OrganizationStatus,
    example: OrganizationStatus.ACTIVE,
  })
  @IsEnum(OrganizationStatus, { message: 'Status inválido' })
  @IsNotEmpty({ message: 'Status é obrigatório' })
  status: OrganizationStatus;
}
