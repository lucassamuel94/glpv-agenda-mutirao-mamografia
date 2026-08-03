import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SlotRepository } from '../../repositories/slot.repository';

/**
 * Hygiene only (RN-22): expired reservations are already treated as free by
 * every read predicate. This just stops the dashboard counts from staying
 * inflated between offers.
 *
 * ponytail: runs without setting `app.current_tenant_id`, so it only sees
 * rows under RLS FORCE if the DB role bypasses RLS (true for the `postgres`
 * superuser used in dev). A prod `app_user` role needs its own bypass path
 * here — add when RLS actually gets enforced there.
 */
@Injectable()
export class ExpiredReservationsCron {
  private readonly logger = new Logger(ExpiredReservationsCron.name);

  constructor(private readonly slots: SlotRepository) {}

  @Cron('*/1 * * * *')
  async releaseExpiredReservations(): Promise<void> {
    const released = await this.slots.releaseExpired(new Date());
    if (released > 0) this.logger.log(`${released} reserva(s) expirada(s) liberada(s).`);
  }
}
