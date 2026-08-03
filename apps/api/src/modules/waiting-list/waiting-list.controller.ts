import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthWithContextGuard } from '../../auth/guards/jwt-auth-with-context.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateWaitingListEntryDto } from './dto/create-waiting-list-entry.dto';
import { WaitingListService } from './waiting-list.service';

@ApiTags('waiting-list')
@ApiBearerAuth()
@Controller('waiting-list')
@UseGuards(JwtAuthWithContextGuard, RolesGuard)
export class WaitingListController {
  constructor(private readonly service: WaitingListService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Adiciona paciente à lista de espera' })
  @ApiResponse({ status: 201, description: 'Entrada criada' })
  create(@Body() data: CreateWaitingListEntryDto) {
    return this.service.add(data);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Lista entradas abertas por ordem de chegada' })
  list() {
    return this.service.list();
  }

  @Patch(':id/contacted')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Marca uma entrada como contatada (RN-45)' })
  async markContacted(@Param('id') id: string) {
    await this.service.markContacted(id);
    return { success: true };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Remove logicamente uma entrada da lista' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { success: true };
  }
}
