import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../../auth/guards/api-key.guard';
import { Public } from './public.decorator';

/**
 * RN-55: marks a route under `/bot/*` as EZ Chat integration surface —
 * skips the global JWT guard (`@Public()`) and requires the shared API key
 * instead (`ApiKeyGuard`, which also seeds the mutirão tenant into CLS).
 */
export const BotEndpoint = () => applyDecorators(Public(), UseGuards(ApiKeyGuard));
