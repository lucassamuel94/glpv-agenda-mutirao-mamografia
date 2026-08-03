import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import { OrganizationUserRepository } from '../repositories/organization-user.repository';
import { OrganizationRepository } from '../repositories/organization.repository';
import { PlanRepository } from '../repositories/plan.repository';
import { SecurityHashService } from '../common/services/security-hash.service';

import {
  Organization,
  OrganizationStatus,
  PLATFORM_TENANT_ID,
} from '../entities/organization.entity';
import { OrganizationUser } from '../entities/organization-user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { CacheService } from '../common/services/cache.service';
import { UserDataService } from '../common/services/user-data.service';
import { LoggerService } from '../common/services/logger.service';
import { CacheNamespace, CacheSubtype, CacheTTL } from '../common/constants/cache.constants';

export interface LoginSessionUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  /**
   * Role na organização ATUAL da sessão (mesmo valor do claim `role` do JWT).
   * Existe aqui porque o token vira cookie httpOnly — o frontend não pode
   * mais decodificar o JWT no cliente pra saber a role; precisa vir no corpo
   * da resposta. Muda a cada `switchOrganization` (role é por organização).
   */
  role?: string;
}

export interface LoginSessionOrganization {
  id: string;
  name: string;
  is_primary: boolean;
  /**
   * Obrigatório de propósito: todo o mundo⇔contexto do frontend deriva
   * `currentTenant` deste campo — omiti-lo não é erro de compilação num
   * projeto-filho, é o SA navegando sem saber onde está.
   */
  is_current: boolean;
  plan?: string;
  status?: string;
}

export interface LoginResult {
  message: string;
  token: string;
  user: LoginSessionUser;
  organizations: LoginSessionOrganization[];
}

export interface RenewHashResult {
  message: string;
  token: string;
}

interface LoginSessionCache {
  user: LoginSessionUser;
  organizations: Array<{
    id: string;
    name: string;
    is_primary: boolean;
    is_current?: boolean;
    plan?: string;
    status?: string;
  }>;
}

@Injectable()
export class AuthService {
  private logger = new LoggerService().setContext('AuthService');

  constructor(
    private userRepository: UserRepository,
    private organizationUserRepository: OrganizationUserRepository,
    private organizationRepository: OrganizationRepository,
    private planRepository: PlanRepository,
    private jwtService: JwtService,
    private securityHashService: SecurityHashService,
    private cacheService: CacheService,
    private userDataService: UserDataService
  ) {}

  /**
   * Realiza login do usuário
   */
  async login(email: string, password: string): Promise<LoginResult> {
    // Busca usuário por email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    // Verifica senha
    const senhaValida = await bcrypt.compare(password, user.password_hash);
    if (!senhaValida) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    // Busca organizações do usuário
    const userOrganizations = await this.organizationUserRepository.findUserOrganizations(user.id);

    const primaryOrganization = userOrganizations[0];

    // Se for Super Admin: pode logar mesmo sem organização vinculada; retorna TODAS as organizações para troca de contexto
    if (user.is_super_admin) {
      const newHash = await this.securityHashService.generateHash();
      await this.userRepository.update(user.id, { hash: newHash });

      const allOrganizations = await this.organizationRepository.findAllWithPlan();

      // Escolha da organização default para o JWT do SA — console é o hub
      // (spec 2026-07-28): o SA aterrissa no Console da Plataforma, então o
      // contexto nasce na Platform tenant. Ida ao CRM de um cliente é sempre um
      // ato explícito ("Entrar na organização"), nunca o estado inicial — o
      // default antigo (org operacional mais recente) fazia o SA navegar dados
      // de um cliente sem indicação de qual.
      // Fallbacks preservam banco pré-migração sem Platform:
      //   1. Platform tenant.
      //   2. Primeira org operacional do vínculo.
      //   3. Primeira org operacional do sistema.
      //   4. Qualquer vínculo (fallback extremo).
      const platformOrg = allOrganizations.find((o) => o.id === PLATFORM_TENANT_ID);
      const operationalLinkedOrg = userOrganizations.find(
        (uo) => (uo as any).organization?.status !== OrganizationStatus.SYSTEM
      );
      const operationalGlobalOrg = allOrganizations.find(
        (o) => (o as any).status !== OrganizationStatus.SYSTEM
      );
      const defaultOrganizationId =
        platformOrg?.id ??
        operationalLinkedOrg?.organization_id ??
        operationalGlobalOrg?.id ??
        primaryOrganization?.organization_id ??
        allOrganizations[0]?.id ??
        null;

      if (!defaultOrganizationId) {
        throw new UnauthorizedException(
          'Nenhuma organização cadastrada no sistema. Crie uma organização primeiro.'
        );
      }

      // JWT com sub-role SA (SA_MASTER, SA_BILLING, SA_USER) para regras por endpoint
      const saRole =
        user.super_admin_role === 'SA_BILLING' || user.super_admin_role === 'SA_USER'
          ? user.super_admin_role
          : 'SA_MASTER';
      const payload = {
        sub: user.id,
        email: user.email,
        organization_id: defaultOrganizationId,
        role: saRole,
        hash: newHash,
      };
      const token = this.jwtService.sign(payload);

      const organizationsList = allOrganizations.map((c, index) => ({
        id: c.id,
        name: c.name,
        is_primary: index === 0,
        is_current: c.id === defaultOrganizationId,
        plan: (c as any).planRelation?.name ?? 'Standard',
        status: (c as any).status ?? undefined,
        primaryColor: c.white_label_settings?.primary_color,
        logoUrl: c.white_label_settings?.logo_url,
        faviconUrl: c.white_label_settings?.favicon_url,
        density: c.white_label_settings?.density,
        theme: c.white_label_settings?.theme,
      }));

      return {
        message: 'Login realizado com sucesso',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: saRole,
        },
        organizations: organizationsList,
      };
    }

    if (!primaryOrganization) {
      throw new UnauthorizedException('Usuário não possui organização associada');
    }

    // Verifica status da organização
    const organization = await this.organizationRepository.findById(
      primaryOrganization.organization_id
    );
    if (!organization) {
      throw new UnauthorizedException('Organização não encontrada');
    }

    // Se a organização está em ACTIVATION, não permite login
    if (organization.status === OrganizationStatus.ACTIVATION) {
      throw new UnauthorizedException(
        'Sua organização está em processo de ativação. Aguarde a liberação pelo administrador do sistema para acessar.'
      );
    }

    // Se a organização está suspensa ou cancelada, não permite login
    if (
      organization.status === OrganizationStatus.SUSPENDED ||
      organization.status === OrganizationStatus.CANCELLED
    ) {
      throw new UnauthorizedException(
        'Sua organização não está ativa. Entre em contato com o suporte.'
      );
    }

    // Gera novo hash de segurança
    const newHash = this.securityHashService.generateUserHash(user.id);

    // Atualiza o hash do usuário no banco
    await this.userRepository.update(user.id, { hash: newHash });

    // Gera token JWT com organization_id da organização principal e hash
    const payload = {
      sub: user.id,
      email: user.email,
      organization_id: primaryOrganization.organization_id,
      role: primaryOrganization.role,
      hash: newHash,
    };
    const token = this.jwtService.sign(payload);

    // Usar UserDataService para obter dados do usuário
    const loginSession = await this.userDataService.getUserForLogin(
      user.id,
      primaryOrganization.organization_id
    );

    //vamos gravar o login session no cache
    await this.cacheService.set(
      this.cacheService.lookupKey(CacheNamespace.AUTH, CacheSubtype.SESSION, user.id),
      loginSession,
      CacheTTL.AUTH_SESSION
    );

    return {
      message: 'Login realizado com sucesso',
      token,
      ...loginSession,
      user: { ...loginSession.user, role: primaryOrganization.role },
    };
  }

  /**
   * Retorna perfil do usuário
   * Agora usa UserDataService para garantir dados sempre atualizados
   */
  async perfil(userId: string, tokenPayload?: any): Promise<any> {
    const currentOrganizationId = tokenPayload?.organization_id as string | undefined;

    // Sempre buscar organizations do UserDataService para ter status atualizado (ex.: ACTIVATION)
    const profile = await this.userDataService.getUserProfile(userId, currentOrganizationId);

    const loginSession = (await this.cacheService.get(
      this.cacheService.lookupKey(CacheNamespace.AUTH, CacheSubtype.SESSION, userId)
    )) as LoginSessionCache | null;

    return {
      user: {
        ...(loginSession?.user ?? {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          avatarUrl: profile.avatarUrl,
          preferences: profile.preferences,
        }),
        // Sempre do token, nunca do cache: é a role da organização ATUAL do
        // token validado nesta request — o cache de login pode ter sido
        // escrito antes de um switch-organization.
        role: tokenPayload?.role,
        must_change_password: profile.must_change_password,
      },
      organizations: profile.organizations,
    };
  }

  /**
   * Realiza logout - invalida o hash atual
   */
  async logout(userId: string): Promise<{ message: string }> {
    // Gera novo hash para invalidar o token atual
    const newHash = this.securityHashService.generateUserHash(userId);
    await this.userRepository.update(userId, { hash: newHash });

    return { message: 'Logout realizado com sucesso' };
  }

  /**
   * Renova o hash de segurança do usuário
   */
  async renewHash(userId: string): Promise<RenewHashResult> {
    // Busca usuário
    const usuario = await this.userRepository.findById(userId);
    if (!usuario) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Busca organização principal
    const primaryOrganization =
      await this.organizationUserRepository.findUserPrimaryOrganization(userId);
    if (!primaryOrganization) {
      throw new UnauthorizedException('Usuário não possui organização associada');
    }

    // Gera novo hash
    const newHash = this.securityHashService.generateUserHash(userId);

    // Atualiza o hash no banco
    await this.userRepository.update(userId, { hash: newHash });

    // Gera novo token com o hash atualizado
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      organization_id: primaryOrganization.organization_id,
      role: primaryOrganization.role,
      hash: newHash,
    };
    const token = this.jwtService.sign(payload);

    return {
      message: 'Hash renovado com sucesso',
      token,
    };
  }

  /**
   * Alterna a organização atual do usuário e emite um novo token
   */
  async switchOrganization(userId: string, organizationId: string): Promise<RenewHashResult> {
    const usuario = await this.userRepository.findById(userId);
    if (!usuario) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const organization = await this.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new UnauthorizedException('Organização não encontrada');
    }

    // Super Admin pode trocar para qualquer organização (sem precisar de vínculo organization_user)
    if (usuario.is_super_admin) {
      const newHash = await this.securityHashService.generateHash();
      await this.userRepository.update(userId, { hash: newHash });

      const saRole =
        usuario.super_admin_role === 'SA_BILLING' || usuario.super_admin_role === 'SA_USER'
          ? usuario.super_admin_role
          : 'SA_MASTER';
      const payload = {
        sub: userId,
        email: usuario.email,
        organization_id: organizationId,
        role: saRole,
        hash: newHash,
      };
      const token = this.jwtService.sign(payload);

      await this.userDataService.invalidateUserCache(userId);

      return {
        message: 'Organização atualizada com sucesso',
        token,
      };
    }

    // Usuário comum: verifica relação usuário-organização
    const userOrganization = await this.organizationUserRepository.findByUserAndOrganization(
      userId,
      organizationId
    );
    if (!userOrganization) {
      throw new UnauthorizedException('Usuário não está associado a esta organização');
    }

    if (
      organization.status === OrganizationStatus.SUSPENDED ||
      organization.status === OrganizationStatus.CANCELLED ||
      organization.status === OrganizationStatus.ACTIVATION
    ) {
      throw new UnauthorizedException('Organização não está ativa');
    }

    // Gera novo hash para invalidar token anterior
    const newHash = this.securityHashService.generateUserHash(userId);
    await this.userRepository.update(userId, { hash: newHash });

    // Emite novo token com organization_id/role da organização selecionada
    const payload = {
      sub: userId,
      email: usuario.email,
      organization_id: organizationId,
      role: userOrganization.role,
      hash: newHash,
    } as any;
    const token = this.jwtService.sign(payload);

    // Atualiza cache de login marcando organização atual
    const sessionKey = this.cacheService.lookupKey(
      CacheNamespace.AUTH,
      CacheSubtype.SESSION,
      userId
    );
    const loginSession = (await this.cacheService.get(sessionKey)) as LoginSessionCache | null;
    if (loginSession) {
      const updated: LoginSessionCache = {
        user: loginSession.user,
        organizations: (loginSession.organizations || []).map((c) => ({
          ...c,
          is_current: c.id === organizationId,
        })),
      };
      await this.cacheService.set(sessionKey, updated, CacheTTL.AUTH_SESSION);
    }

    return {
      message: 'Organização atualizada com sucesso',
      token,
    };
  }

  /**
   * Verifica se o hash do token é válido
   */
  async checkTokenIntegrity(userId: string, tokenHash: string): Promise<boolean> {
    const usuario = await this.userRepository.findById(userId);
    if (!usuario || !usuario.hash) {
      return false;
    }

    return this.securityHashService.compareHashes(tokenHash, usuario.hash);
  }

  /**
   * Decodifica um token JWT sem verificar a assinatura
   * Útil para extrair informações do token mesmo quando inválido
   */
  decodeToken(token: string): any {
    try {
      return this.jwtService.decode(token);
    } catch (error) {
      return null;
    }
  }

  /**
   * Indica se o sistema ainda não foi configurado (nenhuma organização).
   * Usado para redirecionar para a tela de setup no primeiro acesso.
   */
  async getSetupRequired(): Promise<boolean> {
    const organizations = await this.organizationRepository.findAll();
    // Platform (SYSTEM) doesn't count — setup is needed until an operational org exists
    return organizations.filter((o) => o.status !== 'SYSTEM').length === 0;
  }

  /**
   * Branding público (nome, cor, logo, favicon) para renderizar antes do
   * login — tela de login/setup ainda não sabe qual usuário/organização vai
   * autenticar. Deployment é whitelabel de UMA organização operacional por
   * instância (sem resolução por subdomínio), então usamos a primeira
   * organização não-SYSTEM encontrada.
   */
  async getPublicBranding(): Promise<{
    organizationName?: string;
    primaryColor?: string;
    logoUrl?: string;
    faviconUrl?: string;
    density?: string;
    theme?: string;
  }> {
    const organizations = await this.organizationRepository.findAll();
    const organization = organizations.find((o) => o.status !== OrganizationStatus.SYSTEM);
    if (!organization) return {};

    return {
      organizationName: organization.name,
      primaryColor: organization.white_label_settings?.primary_color,
      logoUrl: organization.white_label_settings?.logo_url,
      faviconUrl: organization.white_label_settings?.favicon_url,
      // Também servem ao Super Admin: o contexto dele é a Platform, que não
      // tem white label, então é daqui que vêm densidade e tema da instalação.
      density: organization.white_label_settings?.density,
      theme: organization.white_label_settings?.theme,
    };
  }

  /**
   * Configuração inicial do sistema (primeira organização + primeiro usuário SA).
   * Só é válido quando getSetupRequired() retorna true.
   * Cria organização (ACTIVE) + usuário SA (sem vínculo em organization_users) e retorna login.
   */
  async runSetup(dto: {
    name: string;
    email: string;
    password: string;
    organization_name: string;
    cnpj: string;
    organization_address?: string;
    logo_url?: string;
    icon_url?: string;
    favicon_url?: string;
    primary_color?: string;
    secondary_color?: string;
    theme?: string;
    density?: string;
    locale?: string;
    timezone?: string;
    date_format?: string;
  }): Promise<LoginResult> {
    const setupRequired = await this.getSetupRequired();
    if (!setupRequired) {
      throw new ForbiddenException('O sistema já foi configurado.');
    }

    const normalizedCnpj = dto.cnpj.replace(/\D/g, '');
    if (normalizedCnpj.length !== 14) {
      throw new BadRequestException('CNPJ deve conter 14 dígitos');
    }

    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const existingOrganization = await this.organizationRepository.findByCnpj(normalizedCnpj);
    if (existingOrganization) {
      throw new ConflictException('CNPJ já cadastrado');
    }

    const standardPlan = await this.planRepository.ensureStandardPlan();
    const organization = await this.organizationRepository.create({
      name: dto.organization_name,
      cnpj: normalizedCnpj,
      address: dto.organization_address || null,
      status: OrganizationStatus.ACTIVE,
      plan_id: standardPlan.id,
      white_label_settings: {
        logo_url: dto.logo_url,
        icon_url: dto.icon_url,
        favicon_url: dto.favicon_url ?? dto.icon_url,
        primary_color: dto.primary_color,
        secondary_color: dto.secondary_color,
        theme: dto.theme ?? 'light',
        density: dto.density ?? 'compact',
        locale: dto.locale ?? 'pt-BR',
        timezone: dto.timezone ?? 'America/Sao_Paulo',
        date_format: dto.date_format ?? 'DD/MM/YYYY',
      },
    });

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const hash = this.securityHashService.generateHash();
    const user = await this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password_hash: passwordHash,
      hash,
      is_super_admin: true,
      super_admin_role: 'SA_MASTER',
    });

    await this.organizationRepository.update(organization.id, { created_by: user.id });

    // Vincula o SA à organização operacional como ADMIN (is_primary = true)
    // para que após o login o currentTenant seja a org que ele acabou de criar.
    await this.organizationUserRepository.create({
      user_id: user.id,
      organization_id: organization.id,
      role: 'ADMIN',
      is_primary: true,
      is_active: true,
    } as Partial<OrganizationUser>);

    // Cria a Platform tenant (SYSTEM) e vincula o SA — mesma estrutura do
    // seed-admin.ts. Sem isso, fluxos administrativos que dependem da Platform
    // (usePlatformContext no frontend, switch-organization para a Platform)
    // quebram com "Organização não encontrada".
    let platform = await this.organizationRepository.findById(PLATFORM_TENANT_ID);
    if (!platform) {
      platform = await this.organizationRepository.create({
        id: PLATFORM_TENANT_ID,
        name: 'Platform',
        alias: 'platform',
        cnpj: '00.000.000/0000-00',
        status: OrganizationStatus.SYSTEM,
        plan_id: null,
      } as Partial<Organization>);
    }
    const existingLink = await this.organizationUserRepository.findByUserAndOrganization(
      user.id,
      PLATFORM_TENANT_ID
    );
    if (!existingLink) {
      await this.organizationUserRepository.create({
        user_id: user.id,
        organization_id: PLATFORM_TENANT_ID,
        role: 'SA_MASTER' as any,
        is_primary: false,
        is_active: true,
      } as Partial<OrganizationUser>);
    }

    this.logger.log(`Setup: organization ${organization.id}, SA user ${user.id}`);
    return this.login(dto.email, dto.password);
  }

  /**
   * Registra nova solicitação de acesso (organização + usuário).
   * Cria organização com status ACTIVATION e usuário como ADMIN/primário.
   */
  async register(dto: {
    name: string;
    email: string;
    password: string;
    organization_name: string;
    cnpj: string;
    organization_address?: string;
  }): Promise<{ message: string }> {
    const normalizedCnpj = dto.cnpj.replace(/\D/g, '');
    if (normalizedCnpj.length !== 14) {
      throw new BadRequestException('CNPJ deve conter 14 dígitos');
    }

    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const existingOrganization = await this.organizationRepository.findByCnpj(normalizedCnpj);
    if (existingOrganization) {
      throw new ConflictException('CNPJ já cadastrado');
    }

    const standardPlan = await this.planRepository.ensureStandardPlan();

    const organization = await this.organizationRepository.create({
      name: dto.organization_name,
      cnpj: normalizedCnpj,
      address: dto.organization_address || null,
      status: OrganizationStatus.ACTIVATION,
      plan_id: standardPlan.id,
    });

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password_hash: passwordHash,
    });

    await this.organizationRepository.update(organization.id, { created_by: user.id });

    await this.organizationUserRepository.create({
      organization_id: organization.id,
      user_id: user.id,
      role: UserRole.ADMIN,
      is_primary: true,
    });

    this.logger.log(`Register: organization ${organization.id}, user ${user.id} (ACTIVATION)`);
    return {
      message: 'Solicitação de acesso enviada com sucesso. Aguarde a ativação da sua organização.',
    };
  }

  /**
   * Busca organizações de um usuário
   */
  async getUserOrganizations(userId: string): Promise<any[]> {
    const userOrganizations = await this.organizationUserRepository.findUserOrganizations(userId);
    return userOrganizations.map((ou) => ({
      id: ou.organization.id,
      name: ou.organization.name,
      role: ou.role,
      created_at: ou.created_at,
    }));
  }

  /**
   * Adiciona usuário existente a uma organização
   */
  async addUserToOrganization(userId: string, organizationId: string, role?: string): Promise<any> {
    // Verifica se já existe o relacionamento
    const existing = await this.organizationUserRepository.findByUserAndOrganization(
      userId,
      organizationId
    );
    if (existing) {
      throw new ConflictException('Usuário já está associado a esta organização');
    }

    const organizationUser = await this.organizationUserRepository.create({
      user_id: userId,
      organization_id: organizationId,
      role: (role as any) || 'COORDINATOR',
    });

    return {
      id: organizationUser.id,
      user_id: organizationUser.user_id,
      organization_id: organizationUser.organization_id,
      role: organizationUser.role,
      created_at: organizationUser.created_at,
    };
  }
}
