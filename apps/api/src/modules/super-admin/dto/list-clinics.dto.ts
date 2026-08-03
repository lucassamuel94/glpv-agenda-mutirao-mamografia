import { IsUUID } from 'class-validator';

export class ListClinicsDto {
  @IsUUID()
  organizationId: string;
}
