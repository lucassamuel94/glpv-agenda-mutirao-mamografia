import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BotEndpoint } from '../../common/decorators/bot-endpoint.decorator';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';
import { AppointmentChannel } from '../../entities';
import { AppointmentService } from '../scheduling/appointment.service';
import { OfferService } from '../scheduling/offer.service';
import { PatientsService } from '../patients/patients.service';
import { WaitingListService } from '../waiting-list/waiting-list.service';
import { AbsenceConfirmationDto } from './dto/absence-confirmation.dto';
import { CreateOfferDto } from './dto/create-offer.dto';
import { JoinWaitingListDto } from './dto/join-waiting-list.dto';
import { LookupAppointmentDto } from './dto/lookup-appointment.dto';
import { OfferIdDto } from './dto/offer-id.dto';
import { ReminderResponseDto } from './dto/reminder-response.dto';

/** RN-55: EZ Chat integration surface — API-key auth, no JWT/roles. */
@ApiTags('bot')
@Controller('bot')
@BotEndpoint()
@UseInterceptors(IdempotencyInterceptor)
export class BotController {
  constructor(
    private readonly offers: OfferService,
    private readonly appointments: AppointmentService,
    private readonly patients: PatientsService,
    private readonly waitingList: WaitingListService
  ) {}

  @Post('offer')
  @ApiOperation({ summary: 'Cria uma oferta de vaga balanceada (RN-20/21/24/26/27)' })
  @ApiResponse({ status: 201 })
  async offer(@Body() dto: CreateOfferDto) {
    const patient = await this.patients.findOrCreate(
      dto.fullName,
      dto.birthDate,
      dto.phone,
      dto.altPhone
    );
    return this.offers.createOffer(
      dto.conversationId,
      patient.id,
      dto.birthDate,
      dto.hasMammographyWithin12Months
    );
  }

  @Post('offer/decline')
  @ApiOperation({ summary: 'Recusa a oferta atual e libera a vaga (RN-24)' })
  decline(@Body() dto: OfferIdDto) {
    return this.offers.decline(dto.offerId);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirma o agendamento a partir da oferta (RN-28/29)' })
  confirm(@Body() dto: OfferIdDto) {
    return this.appointments.confirm(dto.offerId, AppointmentChannel.BOT);
  }

  @Post('lookup')
  @ApiOperation({ summary: 'Consulta agendamento por protocolo + data de nascimento (RN-31)' })
  lookup(@Body() dto: LookupAppointmentDto) {
    return this.appointments.lookupByProtocol(dto.protocol, dto.birthDate);
  }

  @Post('reminder-response')
  @ApiOperation({ summary: 'Resposta ao lembrete de presença — passo 1 (RN-41/47/50/51)' })
  reminderResponse(@Body() dto: ReminderResponseDto) {
    return this.appointments.respondToReminder(dto.appointmentId, dto.absent);
  }

  @Post('absence-confirmation')
  @ApiOperation({
    summary: 'Confirmação explícita de ausência — passo 2, só ela cancela (RN-42/51)',
  })
  absenceConfirmation(@Body() dto: AbsenceConfirmationDto) {
    return this.appointments.confirmAbsence(dto.appointmentId, dto.confirmed);
  }

  @Post('waiting-list')
  @ApiOperation({ summary: 'Entra na lista de espera após ausência/desistência (RN-43)' })
  async joinWaitingList(@Body() dto: JoinWaitingListDto) {
    const patient = await this.patients.findOrCreate(
      dto.fullName,
      dto.birthDate,
      dto.phone,
      dto.altPhone
    );
    return this.waitingList.add({
      patient_id: patient.id,
      phone: dto.phone,
      alt_phone: dto.altPhone ?? null,
    });
  }
}
