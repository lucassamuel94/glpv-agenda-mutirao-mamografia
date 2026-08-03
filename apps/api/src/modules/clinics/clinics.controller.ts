import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthWithContextGuard } from '../../auth/guards/jwt-auth-with-context.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ClinicsService } from './clinics.service';

@ApiTags('clinics')
@ApiBearerAuth()
@Controller('clinics')
@UseGuards(JwtAuthWithContextGuard, RolesGuard)
export class ClinicsController {
  constructor(private readonly clinics: ClinicsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Lista clínicas ativas do mutirão (seletor da grade)' })
  list() {
    return this.clinics.list();
  }
}
