import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthWithContextGuard } from '../../auth/guards/jwt-auth-with-context.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { AppointmentService } from './appointment.service';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthWithContextGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentService) {}

  @Get('patient/:patientId')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Histórico de agendamentos da paciente (/pacientes)' })
  history(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.appointments.history(patientId);
  }

  @Post(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Cancela um agendamento com motivo tipificado (RN-35..40)' })
  @ApiResponse({ status: 200 })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelAppointmentDto,
    @CurrentUserId() userId: string
  ) {
    return this.appointments.cancel(id, dto.reason, userId);
  }
}
