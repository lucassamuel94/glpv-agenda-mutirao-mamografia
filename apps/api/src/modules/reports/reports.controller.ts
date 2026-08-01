import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthWithContextGuard } from '../../auth/guards/jwt-auth-with-context.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ReportsService } from './reports.service';
import { ListReportsDto } from './dto/list-reports.dto';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthWithContextGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /** GET /reports — lista o relatório de eventos de auditoria da organização atual. */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Lista o relatório de eventos, com filtro e paginação' })
  @ApiResponse({ status: 200, description: 'Lista paginada de eventos' })
  async findAll(@Query() filters: ListReportsDto) {
    return this.reportsService.findAll(filters);
  }
}
