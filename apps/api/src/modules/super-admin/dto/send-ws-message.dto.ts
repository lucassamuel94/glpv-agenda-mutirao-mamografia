import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsObject,
  IsArray,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WsSendTarget {
  ALL = 'all',
  ORGANIZATION = 'organization',
  USER = 'user',
  ROLES = 'roles',
}

export class SendWsMessageDto {
  @ApiProperty({ description: 'Nome do evento a ser emitido', example: 'notification' })
  @IsString()
  @IsNotEmpty()
  event: string;

  @ApiProperty({
    description: 'Payload da mensagem (objeto livre)',
    example: { title: 'Aviso', message: 'Nova atualização disponível' },
  })
  @IsObject()
  payload: Record<string, unknown>;

  @ApiProperty({
    description: 'Destino da mensagem',
    enum: WsSendTarget,
    example: WsSendTarget.ALL,
  })
  @IsEnum(WsSendTarget)
  target: WsSendTarget;

  @ApiPropertyOptional({
    description: 'ID da organização (obrigatório quando target=organization)',
  })
  @ValidateIf((o) => o.target === WsSendTarget.ORGANIZATION)
  @IsUUID()
  @IsNotEmpty()
  organizationId?: string;

  @ApiPropertyOptional({
    description: 'ID do usuário (obrigatório quando target=user)',
  })
  @ValidateIf((o) => o.target === WsSendTarget.USER)
  @IsUUID()
  @IsNotEmpty()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Enviar apenas para estes roles (quando target=roles)',
    example: ['ADMIN', 'MANAGER'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includeRoles?: string[];

  @ApiPropertyOptional({
    description:
      'Excluir estes roles (quando target=roles). Ex.: ["SA_MASTER","SA_BILLING","SA_USER"] para todos não-SAs',
    example: ['SA_MASTER', 'SA_BILLING', 'SA_USER'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeRoles?: string[];

  @ApiPropertyOptional({
    description:
      'Namespace do Socket.IO (ex.: "notifications", "reports"). Se omitido, usa o namespace padrão "/"',
    example: 'notifications',
  })
  @IsOptional()
  @IsString()
  namespace?: string;
}
