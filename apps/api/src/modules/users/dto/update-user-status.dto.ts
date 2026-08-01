import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para atualização de status ativo/inativo do usuário
 */
export class UpdateUserStatusDto {
  @ApiProperty({
    description: 'Status ativo/inativo do usuário na empresa',
    example: true,
  })
  @IsBoolean({ message: 'is_active deve ser um valor booleano' })
  @IsNotEmpty({ message: 'is_active é obrigatório' })
  is_active: boolean;
}
