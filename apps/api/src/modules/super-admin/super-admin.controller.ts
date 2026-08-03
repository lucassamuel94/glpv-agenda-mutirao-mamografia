import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthWithContextGuard } from '../../auth/guards/jwt-auth-with-context.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { SuperAdminService } from './super-admin.service';
import { CreateSaUserDto } from './dto/create-sa-user.dto';
import { UpdateSaUserDto } from './dto/update-sa-user.dto';
import { UpdateOrganizationStatusDto } from './dto/update-organization-status.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { SendWsMessageDto } from './dto/send-ws-message.dto';
import { ListOrganizationsDto } from './dto/list-organizations.dto';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { ListClinicsDto } from './dto/list-clinics.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';

@ApiTags('super-admin')
@ApiBearerAuth()
@Controller('super-admin')
@UseGuards(JwtAuthWithContextGuard, RolesGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('stats')
  @Roles(UserRole.SA_MASTER, UserRole.SA_BILLING, UserRole.SA_USER)
  @ApiOperation({
    summary: 'Dashboard SA: total de organizações e por organização (plano, usuários)',
  })
  @ApiResponse({ status: 200, description: 'Estatísticas do dashboard' })
  async getStats() {
    return this.superAdminService.getDashboardStats();
  }

  @Get('organizations')
  @Roles(UserRole.SA_MASTER, UserRole.SA_BILLING, UserRole.SA_USER)
  @ApiOperation({
    summary: 'Lista organizações (paginada, ordenável e filtrável) para a tabela do console SA',
  })
  @ApiResponse({ status: 200, description: 'Lista paginada de organizações' })
  async listOrganizations(@Query() dto: ListOrganizationsDto) {
    return this.superAdminService.listOrganizations(dto);
  }

  @Post('organizations')
  @Roles(UserRole.SA_MASTER, UserRole.SA_USER)
  @ApiOperation({ summary: 'Cria nova organização' })
  @ApiResponse({ status: 201, description: 'Organização criada' })
  @ApiResponse({ status: 409, description: 'CNPJ já cadastrado' })
  async createOrganization(@Body() dto: CreateOrganizationDto, @Req() req: Request) {
    const user = req.user as { sub?: string };
    return this.superAdminService.createOrganization(dto, user?.sub);
  }

  @Post('clinics')
  @Roles(UserRole.SA_MASTER, UserRole.SA_USER)
  @ApiOperation({ summary: 'Cadastra uma clínica do Grupo Luta Pela Vida' })
  @ApiResponse({ status: 201, description: 'Clínica cadastrada' })
  @ApiResponse({ status: 403, description: 'Apenas Super Admin' })
  async createClinic(@Body() dto: CreateClinicDto) {
    return this.superAdminService.createClinic(dto);
  }

  @Get('clinics')
  @Roles(UserRole.SA_MASTER, UserRole.SA_USER)
  @ApiOperation({ summary: 'Lista clínicas do Grupo Luta Pela Vida' })
  @ApiResponse({ status: 200, description: 'Clínicas cadastradas' })
  async listClinics(@Query() dto: ListClinicsDto) {
    return this.superAdminService.listClinics(dto.organizationId);
  }

  @Patch('clinics/:id')
  @Roles(UserRole.SA_MASTER, UserRole.SA_USER)
  @ApiOperation({ summary: 'Atualiza uma clínica do Grupo Luta Pela Vida' })
  @ApiResponse({ status: 200, description: 'Clínica atualizada' })
  async updateClinic(@Param('id') id: string, @Body() dto: UpdateClinicDto) {
    return this.superAdminService.updateClinic(id, dto);
  }

  @Delete('clinics/:id')
  @Roles(UserRole.SA_MASTER, UserRole.SA_USER)
  @ApiOperation({ summary: 'Remove uma clínica do Grupo Luta Pela Vida' })
  @ApiResponse({ status: 200, description: 'Clínica removida' })
  async deleteClinic(@Param('id') id: string) {
    return this.superAdminService.deleteClinic(id);
  }

  @Patch('organizations/:id')
  @Roles(UserRole.SA_MASTER, UserRole.SA_USER)
  @ApiOperation({ summary: 'Atualiza uma organização' })
  @ApiResponse({ status: 200, description: 'Organização atualizada' })
  @ApiResponse({ status: 404, description: 'Organização não encontrada' })
  @ApiResponse({ status: 409, description: 'CNPJ já cadastrado' })
  async updateOrganization(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.superAdminService.updateOrganization(id, dto);
  }

  @Get('organizations/:id')
  @Roles(UserRole.SA_MASTER, UserRole.SA_USER)
  @ApiOperation({ summary: 'Busca uma organização por ID (para edição)' })
  @ApiResponse({ status: 200, description: 'Dados da organização' })
  @ApiResponse({ status: 404, description: 'Organização não encontrada' })
  async getOrganization(@Param('id') id: string) {
    return this.superAdminService.getOrganization(id);
  }

  @Patch('organizations/:id/status')
  @Roles(UserRole.SA_MASTER, UserRole.SA_USER)
  @ApiOperation({ summary: 'Atualiza status de uma organização' })
  @ApiResponse({ status: 200, description: 'Status atualizado' })
  @ApiResponse({ status: 404, description: 'Organização não encontrada' })
  async updateOrganizationStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationStatusDto
  ) {
    return this.superAdminService.updateOrganizationStatus(id, dto.status);
  }

  @Delete('organizations/:id')
  @Roles(UserRole.SA_MASTER)
  @ApiOperation({
    summary: 'Exclui uma organização (não permitido se houver usuários SA vinculados)',
  })
  @ApiResponse({ status: 200, description: 'Organização excluída' })
  @ApiResponse({ status: 400, description: 'Organização possui usuários SA vinculados' })
  @ApiResponse({ status: 404, description: 'Organização não encontrada' })
  async deleteOrganization(@Param('id') id: string) {
    return this.superAdminService.deleteOrganization(id);
  }

  @Get('users')
  @Roles(UserRole.SA_MASTER, UserRole.SA_USER)
  @ApiOperation({ summary: 'Lista usuários Super Admin' })
  @ApiResponse({ status: 200, description: 'Lista de usuários SA' })
  async listUsers() {
    return this.superAdminService.listSaUsers();
  }

  @Post('users')
  @Roles(UserRole.SA_MASTER, UserRole.SA_USER)
  @ApiOperation({ summary: 'Cria novo usuário Super Admin' })
  @ApiResponse({ status: 201, description: 'Usuário SA criado' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
  async createUser(@Body() dto: CreateSaUserDto, @Req() req: Request) {
    const user = req.user as { sub?: string };
    return this.superAdminService.createSaUser(dto, user?.sub);
  }

  @Put('users/:id')
  @Roles(UserRole.SA_MASTER, UserRole.SA_USER)
  @ApiOperation({ summary: 'Atualiza usuário SA' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado' })
  @ApiResponse({ status: 400, description: 'Não pode editar a si mesmo' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateSaUserDto, @Req() req: Request) {
    const currentUser = req.user as { sub?: string };
    return this.superAdminService.updateSaUser(id, dto, currentUser?.sub ?? '');
  }

  @Patch('users/:id/deactivate')
  @Roles(UserRole.SA_MASTER, UserRole.SA_USER)
  @ApiOperation({ summary: 'Desativa usuário SA' })
  @ApiResponse({ status: 200, description: 'Usuário desativado' })
  @ApiResponse({ status: 400, description: 'Não pode desativar a si mesmo' })
  async deactivateUser(@Param('id') id: string, @Req() req: Request) {
    const currentUser = req.user as { sub?: string };
    return this.superAdminService.deactivateSaUser(id, currentUser?.sub ?? '');
  }

  @Patch('users/:id/activate')
  @Roles(UserRole.SA_MASTER, UserRole.SA_USER)
  @ApiOperation({ summary: 'Reativa usuário SA' })
  @ApiResponse({ status: 200, description: 'Usuário ativado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async activateUser(@Param('id') id: string, @Req() req: Request) {
    const currentUser = req.user as { sub?: string };
    return this.superAdminService.activateSaUser(id, currentUser?.sub ?? '');
  }

  @Delete('users/:id')
  @Roles(UserRole.SA_MASTER, UserRole.SA_USER)
  @ApiOperation({ summary: 'Exclui usuário SA' })
  @ApiResponse({ status: 200, description: 'Usuário excluído' })
  @ApiResponse({ status: 400, description: 'Não pode excluir a si mesmo' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async deleteUser(@Param('id') id: string, @Req() req: Request) {
    const currentUser = req.user as { sub?: string };
    return this.superAdminService.deleteSaUser(id, currentUser?.sub ?? '');
  }

  @Post('ws/send')
  @Roles(UserRole.SA_MASTER)
  @ApiOperation({
    summary: 'Envia mensagem para conexões WebSocket ativas (apenas SA_MASTER)',
    description:
      'Target: all (broadcast), organization (organizationId), user (userId), roles (includeRoles ou excludeRoles)',
  })
  @ApiResponse({ status: 200, description: 'Mensagem enviada' })
  @ApiResponse({ status: 400, description: 'Payload inválido ou target sem parâmetro obrigatório' })
  async sendWsMessage(@Body() dto: SendWsMessageDto) {
    return this.superAdminService.sendWsMessage(dto);
  }
}
