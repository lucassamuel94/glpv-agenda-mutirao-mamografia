import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan, PlanLimits } from '../entities/plan.entity';

@Injectable()
export class PlanRepository {
  constructor(@InjectRepository(Plan, 'master') private repository: Repository<Plan>) {}

  async findById(id: string): Promise<Plan | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByKey(key: string): Promise<Plan | null> {
    return this.repository.findOne({ where: { key } });
  }

  async create(data: Partial<Plan>): Promise<Plan> {
    const plan = this.repository.create(data);
    return this.repository.save(plan);
  }

  async ensureStandardPlan(): Promise<Plan> {
    const existing = await this.findByKey('STANDARD');
    if (existing) return existing;

    const limits: PlanLimits = {
      users: 2,
    };
    return this.create({
      key: 'STANDARD',
      name: 'Standard',
      description: 'Plano padrão com limites básicos',
      limits,
      is_active: true,
    });
  }
}
