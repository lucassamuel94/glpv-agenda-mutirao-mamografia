import { Injectable, ForbiddenException } from '@nestjs/common';
import { CacheService } from './cache.service';
import { LoggerService } from './logger.service';
import { RequestContextService } from './cls.service';
import { UserRepository } from '../../repositories/user.repository';
import { OrganizationUserRepository } from '../../repositories/organization-user.repository';
import { OrganizationRepository } from '../../repositories/organization.repository';
import { UserPreferences } from '../interfaces/user-preferences.interface';
import { CacheNamespace, CacheSubtype, CacheTTL } from '../constants/cache.constants';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  preferences: UserPreferences | null;
  must_change_password: boolean;
  organizations: Array<{
    id: string;
    name: string;
    is_primary: boolean;
    is_current: boolean;
    plan?: string;
    status?: string;
    primaryColor?: string;
    logoUrl?: string;
    faviconUrl?: string;
    /** Defaults de white label da organização; a preferência do usuário sobrepõe. */
    density?: string;
    theme?: string;
  }>;
}

export interface UpdateUserProfileData {
  name?: string;
  newPassword?: string;
  preferences?: UserPreferences;
  avatarUrl?: string;
}

@Injectable()
export class UserDataService {
  private readonly logger = new LoggerService().setContext('UserDataService');

  constructor(
    private cacheService: CacheService,
    private requestContextService: RequestContextService,
    private userRepository: UserRepository,
    private organizationUserRepository: OrganizationUserRepository,
    private organizationRepository: OrganizationRepository
  ) {}

  /**
   * Obtém o perfil completo do usuário
   * Centraliza toda lógica de dados do usuário em um só lugar
   */
  async getUserProfile(userId: string, currentOrganizationId?: string): Promise<UserProfile> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Super Admin: retorna todas as organizações do sistema para poder trocar para qualquer uma
    if (user.is_super_admin) {
      // A organização SYSTEM ("Platform") CONTINUA na lista de propósito: é o
      // contexto em que o Super Admin aterrissa (ver auth.service.ts, spec do
      // Console) e o seletor precisa mostrar onde ele está. Ela não tem white
      // label — quem cobre isso é o branding público no front, não a omissão
      // dela aqui.
      const allOrganizations = await this.organizationRepository.findAllWithPlan();
      const organizations = allOrganizations.map((c, index) => ({
        id: c.id,
        name: c.name,
        is_primary: index === 0,
        is_current: currentOrganizationId ? c.id === currentOrganizationId : index === 0,
        plan: (c as any).planRelation?.name ?? 'Standard',
        status: (c as any).status ?? undefined,
        primaryColor: c.white_label_settings?.primary_color,
        logoUrl: c.white_label_settings?.logo_url,
        faviconUrl: c.white_label_settings?.favicon_url,
        density: c.white_label_settings?.density,
        theme: c.white_label_settings?.theme,
      }));
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatar_url || null,
        preferences: user.preferences || null,
        must_change_password: user.must_change_password === true,
        organizations,
      };
    }

    // Chave: user:profile:global:{userId}
    const cacheKey = this.cacheService.lookupKey(CacheNamespace.USER, CacheSubtype.PROFILE, userId);

    // Tentar buscar do cache primeiro
    const cached = await this.cacheService.get<UserProfile>(cacheKey);
    if (cached) {
      // Cache antigo pode não ter status nas organizations; nesse caso refetch
      const hasStatus =
        cached.organizations.length === 0 ||
        cached.organizations.every((c) => c.status !== undefined);
      if (!hasStatus) {
        await this.cacheService.delete(cacheKey);
      } else {
        this.logger.log(`Cache HIT for user profile ${userId}`);

        // Atualizar is_current baseado no currentOrganizationId se fornecido
        if (currentOrganizationId) {
          cached.organizations = cached.organizations.map((org) => ({
            ...org,
            is_current: org.id === currentOrganizationId,
          }));
        }

        return cached;
      }
    }

    this.logger.log(`Cache MISS for user profile ${userId}, fetching from database`);

    // Buscar dados frescos do banco (user já carregado acima para SA; para outros carregamos de novo)
    const userForOrganizations = await this.userRepository.findById(userId);
    if (!userForOrganizations) {
      throw new Error('Usuário não encontrado');
    }

    // Buscar organizações do usuário
    const userOrganizations = await this.organizationUserRepository.findUserOrganizations(userId);

    // Construir perfil
    const profile: UserProfile = {
      id: userForOrganizations.id,
      name: userForOrganizations.name,
      email: userForOrganizations.email,
      avatarUrl: userForOrganizations.avatar_url || null,
      preferences: userForOrganizations.preferences || null,
      must_change_password: userForOrganizations.must_change_password === true,
      organizations: userOrganizations.map((ou, index) => ({
        id: ou.organization.id,
        name: ou.organization.name,
        is_primary: index === 0, // Primeira organização é sempre a principal
        is_current: currentOrganizationId
          ? ou.organization.id === currentOrganizationId
          : index === 0,
        plan: (ou.organization as any).planRelation?.name ?? 'Standard',
        status: (ou.organization as any).status ?? undefined,
        primaryColor: ou.organization.white_label_settings?.primary_color,
        logoUrl: ou.organization.white_label_settings?.logo_url,
        faviconUrl: ou.organization.white_label_settings?.favicon_url,
        density: ou.organization.white_label_settings?.density,
        theme: ou.organization.white_label_settings?.theme,
      })),
    };

    // Salvar no cache por 1 hora (TTL centralizado em cache.constants.ts)
    await this.cacheService.set(cacheKey, profile, CacheTTL.USER_PROFILE);
    this.logger.log(`Cached user profile ${userId} for ${CacheTTL.USER_PROFILE}s`);

    return profile;
  }

  /**
   * Atualiza o perfil do usuário
   * Centraliza toda lógica de atualização e invalidação de cache
   */
  async updateUserProfile(
    userId: string,
    updateData: UpdateUserProfileData
  ): Promise<{
    message: string;
    user: { id: string; name: string; email: string; avatar_url: string | null };
  }> {
    this.logger.log(`Updating profile for user ${userId}`, 'UserDataService');

    // Buscar usuário atual
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Regras de segurança: quem pode alterar qual perfil
    const callerUserId = this.requestContextService.getUserId();
    const callerRole = this.requestContextService.getUserRole();
    const isEditingOtherUser = callerUserId && callerUserId !== userId;

    if (isEditingOtherUser) {
      if (callerRole === 'SA_BILLING') {
        throw new ForbiddenException('SA_BILLING não pode alterar perfis de outros usuários.');
      }
      const targetIsSa = user.is_super_admin === true || user.super_admin_role != null;
      if (targetIsSa && callerRole !== 'SA_MASTER') {
        throw new ForbiddenException(
          'Apenas SA_MASTER pode alterar perfil de usuário Super Admin.'
        );
      }
    }

    // Preparar dados para atualização
    const updateFields: Partial<typeof user> = {};

    if (updateData.name) {
      user.name = updateData.name;
      updateFields.name = updateData.name;
    }

    if (updateData.newPassword) {
      const bcrypt = await import('bcrypt');
      const senhaHash = await bcrypt.hash(updateData.newPassword, 10);
      user.password_hash = senhaHash;
      updateFields.password_hash = senhaHash;
      updateFields.must_change_password = false; // Usuário trocou a senha
      this.logger.log(`Password updated for user ${userId}`, 'UserDataService');
    }

    if (updateData.preferences !== undefined) {
      // Validar estrutura de preferências
      if (updateData.preferences && typeof updateData.preferences === 'object') {
        user.preferences = updateData.preferences;
        updateFields.preferences = updateData.preferences;
        this.logger.log(`Preferences updated for user ${userId}`, 'UserDataService');
      } else if (updateData.preferences === null) {
        user.preferences = null;
        updateFields.preferences = null;
        this.logger.log(`Preferences cleared for user ${userId}`, 'UserDataService');
      }
    }

    if (updateData.avatarUrl !== undefined) {
      const avatarUrl = updateData.avatarUrl || null;
      user.avatar_url = avatarUrl;
      updateFields.avatar_url = avatarUrl;
      this.logger.log(`Avatar updated for user ${userId}`, 'UserDataService');
    }

    // Atualizar no banco
    await this.userRepository.update(userId, updateFields);

    // INVALIDAR TODOS OS CACHES RELACIONADOS
    await this.invalidateUserCache(userId);

    this.logger.log(`Profile updated successfully for user ${userId}`, 'UserDataService');

    return {
      message: 'Perfil atualizado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      },
    };
  }

  /**
   * Invalida todos os caches relacionados ao usuário
   * Método centralizado para garantir consistência
   */
  async invalidateUserCache(userId: string): Promise<void> {
    this.logger.log(`Invalidating all caches for user ${userId}`, 'UserDataService');

    // user:profile:global:{id}, auth:session:global:{id}, user:item:global:{id}
    const cacheKeys = [
      this.cacheService.lookupKey(CacheNamespace.USER, CacheSubtype.PROFILE, userId),
      this.cacheService.lookupKey(CacheNamespace.AUTH, CacheSubtype.SESSION, userId),
      this.cacheService.itemKey(CacheNamespace.USER, userId),
    ];

    for (const key of cacheKeys) {
      await this.cacheService.delete(key);
    }

    this.logger.log(`All caches invalidated for user ${userId}`, 'UserDataService');
  }

  /**
   * Recria o cache de login-session após invalidação
   * Usado pelo AuthService para manter compatibilidade
   */
  async recreateLoginSession(userId: string, currentOrganizationId?: string): Promise<any> {
    this.logger.log(`Recreating login session for user ${userId}`, 'UserDataService');

    const profile = await this.getUserProfile(userId, currentOrganizationId);

    const loginSession = {
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        preferences: profile.preferences,
      },
      organizations: profile.organizations.map((org) => ({
        id: org.id,
        name: org.name,
        is_primary: org.is_primary,
        is_current: org.is_current,
        plan: org.plan,
        status: org.status,
        primaryColor: org.primaryColor,
        logoUrl: org.logoUrl,
        faviconUrl: org.faviconUrl,
        density: org.density,
        theme: org.theme,
      })),
    };

    // Salvar no cache de auth:session:global:{userId}
    await this.cacheService.set(
      this.cacheService.lookupKey(CacheNamespace.AUTH, CacheSubtype.SESSION, userId),
      loginSession,
      CacheTTL.AUTH_SESSION
    );

    this.logger.log(`Login session recreated for user ${userId}`, 'UserDataService');

    return loginSession;
  }

  /**
   * Obtém dados do usuário para login
   * Usado pelo AuthService durante o processo de login
   */
  async getUserForLogin(userId: string, primaryOrganizationId: string): Promise<any> {
    const profile = await this.getUserProfile(userId, primaryOrganizationId);

    return {
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        preferences: profile.preferences,
        must_change_password: profile.must_change_password,
      },
      organizations: profile.organizations,
    };
  }
}
