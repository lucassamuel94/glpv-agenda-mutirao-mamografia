import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PlanRepository } from '../repositories/plan.repository';

/**
 * Garante que o plano STANDARD existe no banco ao subir a aplicação.
 */
@Injectable()
export class PlansSeedService implements OnModuleInit {
  private readonly logger = new Logger(PlansSeedService.name);

  constructor(private readonly planRepository: PlanRepository) {}

  async onModuleInit(): Promise<void> {
    try {
      const standardPlan = await this.planRepository.ensureStandardPlan();
      this.logger.log(`Plan STANDARD ensured: ${standardPlan.id}`);
    } catch (e) {
      this.logger.warn('Plans seed skipped or failed', e);
    }
  }
}
