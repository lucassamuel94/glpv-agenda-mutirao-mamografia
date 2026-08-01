import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthWithContextGuard } from '../../auth/guards/jwt-auth-with-context.guard';
import { ListUsersDto } from './dto/list-users.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { PreventSelfEdit } from '../../common/decorators/prevent-self-edit.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthWithContextGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * POST /users
   * Cadastra um novo usuário ou adiciona usuário existente à empresa atual
   * Lógica inteligente: verifica se email existe e decide a ação
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createUser(@Body() createUsuarioDto: CreateUserDto) {
    return await this.usersService.cadastrarUser(createUsuarioDto);
  }

  /**
   * GET /users
   * Lista usuários da empresa atual (excluindo o usuário logado)
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findUsers(@Query() filters: ListUsersDto) {
    return await this.usersService.findWithFilters(filters);
  }

  /**
   * POST /users/invite
   * Vincula usuário existente à empresa atual por e-mail (convite).
   * Requer que o usuário já esteja cadastrado no sistema.
   */
  @Post('invite')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Convidar usuário para a empresa',
    description:
      'Vincula um usuário já cadastrado à empresa atual pelo e-mail. O usuário passará a aparecer na equipe e poderá fazer login nesta empresa.',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async inviteUser(@Body() inviteUserDto: InviteUserDto) {
    return await this.usersService.inviteUserByEmail(inviteUserDto.email, inviteUserDto.role);
  }

  /**
   * GET /users/:id
   * Busca usuário por ID na empresa atual
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findUserById(@Param('id') id: string) {
    return await this.usersService.buscarUserPorId(id);
  }

  /**
   * PUT /users/profile
   * Atualiza o perfil pessoal do usuário logado
   * Permite alterar apenas nome e senha (email não pode ser alterado)
   * Qualquer usuário autenticado pode atualizar seu próprio perfil
   */
  @Put('profile')
  @ApiOperation({
    summary: 'Atualizar perfil pessoal',
    description:
      'Permite ao usuário alterar seus próprios dados (nome e senha). Email não pode ser alterado. Qualquer usuário autenticado pode usar este endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Perfil atualizado com sucesso' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid' },
            name: { type: 'string', example: 'João Silva' },
            email: { type: 'string', example: 'joao@email.com' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou senha atual incorreta',
  })
  // Não precisa de @Roles - qualquer usuário autenticado pode atualizar seu próprio perfil
  async updateUserProfile(@Body() updateUserProfileDto: UpdateUserProfileDto) {
    return await this.usersService.updateProfile(updateUserProfileDto);
  }

  /**
   * PUT /users/:id
   * Atualiza dados do usuário na empresa atual
   * Previne auto-edição através do decorator PreventSelfEdit
   */
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateUser(@PreventSelfEdit() id: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.usersService.updateUser(id, updateUserDto);
  }

  /**
   * PUT /users/:id/role
   * Atualiza role do usuário na empresa atual
   * Apenas admins podem fazer isso
   * Previne auto-edição através do decorator PreventSelfEdit
   */
  @Put(':id/role')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateUserRole(
    @PreventSelfEdit() id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto
  ) {
    return await this.usersService.atualizarRoleUser(id, updateUserRoleDto.role);
  }

  /**
   * PUT /users/:id/status
   * Atualiza status ativo/inativo do usuário na empresa atual
   * Apenas admins podem fazer isso
   * Previne auto-edição através do decorator PreventSelfEdit
   */
  @Put(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateUserStatus(
    @PreventSelfEdit() id: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto
  ) {
    return await this.usersService.updateUserStatus(id, updateUserStatusDto.is_active);
  }

  /**
   * DELETE /users/:id
   * Remove usuário da empresa atual (não deleta o usuário do sistema)
   * Apenas admins podem fazer isso
   * Previne auto-edição através do decorator PreventSelfEdit
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async removeUserFromOrganization(@PreventSelfEdit() id: string) {
    await this.usersService.removerUserDaEmpresa(id);
    return { message: 'Usuário removido da empresa com sucesso' };
  }

  /**
   * POST /users/bulk-remove
   * Remove múltiplos usuários da organização em massa.
   * Regras de proteção aplicadas por item: self-remove, conta principal,
   * Super Admin. Retorna lista de falhas com motivo.
   */
  @Post('bulk-remove')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Remove múltiplos membros da organização em massa',
  })
  @ApiResponse({
    status: 200,
    description: 'Retorna contagem de removidos e lista de falhas (com motivo)',
  })
  async bulkRemoveUsersFromOrganization(@Body() body: { ids: string[] }) {
    return this.usersService.bulkRemoveUsersFromOrganization(body.ids);
  }

  /**
   * POST /users/bulk-status
   * Ativa ou desativa múltiplos membros da organização em massa.
   * Mesmas regras de proteção do bulk-remove.
   */
  @Post('bulk-status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Ativa/desativa múltiplos membros da organização em massa',
  })
  @ApiResponse({
    status: 200,
    description: 'Retorna contagem de atualizados e lista de falhas (com motivo)',
  })
  async bulkUpdateUserStatus(@Body() body: { ids: string[]; is_active: boolean }) {
    return this.usersService.bulkUpdateUserStatus(body.ids, body.is_active);
  }
}
