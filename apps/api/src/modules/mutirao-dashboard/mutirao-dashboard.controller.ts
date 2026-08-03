import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthWithContextGuard } from '../../auth/guards/jwt-auth-with-context.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { MutiraoDashboardService } from './mutirao-dashboard.service';

@ApiTags('mutirao-dashboard')
@ApiBearerAuth()
@Controller('dashboard-mutirao')
@UseGuards(JwtAuthWithContextGuard, RolesGuard)
export class MutiraoDashboardController {
  constructor(private readonly service: MutiraoDashboardService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Indicadores consolidados do mutirão' })
  getOverview() {
    return this.service.overview();
  }

  @Get('export')
  @Roles(UserRole.ADMIN)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="relatorio-mutirao.csv"')
  @ApiOperation({ summary: 'Relatório em CSV (RN-54) — BOM UTF-8, abre no Excel' })
  export() {
    return this.service.exportCsv();
  }
}
