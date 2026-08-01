import { IsOptional, IsString, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class SelectFieldsDto {
  @IsOptional()
  @IsString({ message: 'Campos deve ser uma string separada por vírgulas' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((field) => field.trim())
        .filter((field) => field.length > 0);
    }
    return value;
  })
  fields?: string[];

  @IsOptional()
  @IsArray({ message: 'Campos deve ser um array de strings' })
  @IsString({ each: true, message: 'Cada campo deve ser uma string' })
  select?: string[];
}
