import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdempotencyRecord } from '../entities';

@Injectable()
export class IdempotencyRecordRepository {
  constructor(
    @InjectRepository(IdempotencyRecord, 'master')
    private readonly repository: Repository<IdempotencyRecord>
  ) {}

  findByKey(key: string): Promise<IdempotencyRecord | null> {
    return this.repository.findOne({ where: { key } });
  }

  async save(key: string, endpoint: string, responseBody: Record<string, unknown>): Promise<void> {
    try {
      await this.repository.insert({ key, endpoint, response_body: responseBody });
    } catch {
      // Concurrent replay raced us to the same key — the first writer's
      // record is the one that matters; nothing to do with the loser.
    }
  }
}
