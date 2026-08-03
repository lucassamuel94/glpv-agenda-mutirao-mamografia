import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthWithContextGuard } from '../../auth/guards/jwt-auth-with-context.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { FindOrCreatePatientDto } from './dto/find-or-create-patient.dto';
import { SearchPatientsDto } from './dto/search-patients.dto';
import { PatientsService } from './patients.service';

@ApiTags('patients')
@ApiBearerAuth()
@Controller('patients')
@UseGuards(JwtAuthWithContextGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Post('search')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Busca pacientes por nome ou telefone (RN-58: body, não query)' })
  @ApiResponse({ status: 200 })
  search(@Body() dto: SearchPatientsDto) {
    return this.patients.search(dto.term);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Cadastra ou reaproveita a paciente para agendamento manual (RN-04/05/32)',
  })
  @ApiResponse({ status: 201 })
  findOrCreate(@Body() dto: FindOrCreatePatientDto) {
    return this.patients.findOrCreate(dto.fullName, dto.birthDate, dto.phone, dto.altPhone);
  }
}
