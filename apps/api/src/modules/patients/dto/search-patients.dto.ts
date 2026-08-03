import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

/** RN-58: search is POST with the term in the body, never a query param. */
export class SearchPatientsDto {
  @ApiProperty({ description: 'Nome (parcial) ou telefone' })
  @IsString()
  @MinLength(2)
  term: string;
}
