import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthWithContextGuard } from '../../auth/guards/jwt-auth-with-context.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { AppointmentService } from './appointment.service';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { ManualBookingDto } from './dto/manual-booking.dto';
import { SlotGridQueryDto } from './dto/slot-grid-query.dto';
import { SlotHoldDto } from './dto/slot-hold.dto';
import { SuggestQueryDto } from './dto/suggest-query.dto';
import { SlotService } from './slot.service';

@ApiTags('scheduling')
@ApiBearerAuth()
@Controller('scheduling')
@UseGuards(JwtAuthWithContextGuard, RolesGuard)
export class SchedulingController {
  constructor(
    private readonly slotService: SlotService,
    private readonly appointmentService: AppointmentService
  ) {}

  @Get('slots')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Grade de vagas por clínica/dia (RN-32)' })
  slots(@Query() query: SlotGridQueryDto) {
    return this.slotService.grid(query.clinicId, query.date);
  }

  @Get('availability')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Disponibilidade por dia/clínica no intervalo + equilíbrio das clínicas',
    description:
      'Uma chamada cobre o mês do calendário do painel, no lugar de uma requisição por clínica/dia.',
  })
  availability(@Query() query: AvailabilityQueryDto) {
    return this.slotService.availability(query);
  }

  @Get('suggest')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Melhores encaixes na janela (mais cedo, melhor equilíbrio e alternativas)',
  })
  suggest(@Query() query: SuggestQueryDto) {
    return this.slotService.suggest({ ...query, limit: query.limit ?? 3 });
  }

  @Post('hold')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Segura a vaga durante o preenchimento do formulário (hold otimista)',
  })
  @ApiResponse({ status: 409, description: 'Vaga não está mais livre' })
  hold(@Body() dto: SlotHoldDto) {
    return this.slotService.hold(dto.slotId);
  }

  @Post('hold/release')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Libera o hold quando a operadora desiste do agendamento' })
  releaseHold(@Body() dto: SlotHoldDto) {
    return this.slotService.releaseHold(dto.slotId);
  }

  @Post('manual-booking')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Agendamento manual pelo painel — vaga escolhida sem balanceamento (RN-32)',
  })
  @ApiResponse({ status: 201 })
  manualBooking(@Body() dto: ManualBookingDto, @CurrentUserId() userId: string) {
    return this.appointmentService.bookManually(
      dto.slotId,
      dto.patientId,
      dto.birthDate,
      dto.hasMammographyWithin12Months,
      userId
    );
  }
}
