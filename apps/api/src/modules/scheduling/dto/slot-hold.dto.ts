import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SlotHoldDto {
  @ApiProperty({ description: 'Vaga a segurar enquanto a operadora preenche o formulário' })
  @IsUUID()
  slotId: string;
}
