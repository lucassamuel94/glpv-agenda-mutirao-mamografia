import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthWithContextGuard } from '../auth/guards/jwt-auth-with-context.guard';
import { SkipTenantContext } from '../common/decorators/skip-tenant-context.decorator';
import { Public } from '../common/decorators/public.decorator';

/**
 * Controller responsável pelas rotas de autenticação
 * Gerencia login, registro, logout e perfil do usuário
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /auth/login
   * Autentica usuário e retorna token JWT
   */
  @ApiOperation({
    summary: 'Login do usuário',
    description: 'Autentica usuário com email e senha, retornando token JWT',
  })
  @ApiBody({
    type: LoginDto,
    description: 'Credenciais de login',
  })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Login realizado com sucesso' },
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid' },
            name: { type: 'string', example: 'Carlos Silva' },
            email: { type: 'string', example: 'carlos@ezfrotas.com.br' },
            role: { type: 'string', example: 'ADMIN' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
  })
  /**
   * GET /auth/setup-status
   * Indica se o sistema ainda não foi configurado (nenhuma organização).
   * Público; usado pelo frontend para redirecionar para /setup no primeiro acesso.
   */
  @Get('setup-status')
  @SkipTenantContext()
  @Public()
  @ApiOperation({ summary: 'Verifica se a configuração inicial é necessária' })
  @ApiResponse({ status: 200, description: 'setupRequired: true quando não há organizações' })
  async getSetupStatus() {
    const setupRequired = await this.authService.getSetupRequired();
    return { setupRequired };
  }

  /**
   * GET /auth/branding
   * Branding público (nome, cor, logo, favicon) da organização operacional
   * da instância — usado nas telas de login/setup, antes de autenticar.
   */
  @Get('branding')
  @SkipTenantContext()
  @Public()
  @ApiOperation({ summary: 'Branding público da organização (whitelabel)' })
  async getBranding() {
    return this.authService.getPublicBranding();
  }

  /**
   * POST /auth/setup
   * Configuração inicial: cria primeira organização + primeiro usuário SA (sem vínculo).
   * Só válido quando setup-status retorna setupRequired: true.
   * Retorna login (token + user + organizations) e define cookie; usuário já fica logado.
   */
  @Post('setup')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @SkipTenantContext()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Configuração inicial do sistema (primeira organização + SA)' })
  @ApiResponse({ status: 200, description: 'Configuração concluída e login retornado' })
  @ApiResponse({ status: 403, description: 'Sistema já configurado' })
  @ApiResponse({ status: 409, description: 'E-mail ou CNPJ já cadastrado' })
  async setup(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.runSetup(dto);
    response.cookie('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return {
      message: 'Configuração concluída com sucesso.',
      access_token: result.token,
      user: result.user,
      organizations: result.organizations,
    };
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @SkipTenantContext()
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(loginDto.email, loginDto.password);

    // Define cookie httpOnly com o token
    response.cookie('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });
    const url = response.req.url;
    // Retorna dados incluindo o token para o frontend
    return {
      message: result.message,
      access_token: result.token,
      user: result.user,
      organizations: result.organizations,
      url: url,
    };
  }

  /**
   * POST /auth/register
   * Solicitação de acesso: cria empresa (ACTIVATION) + usuário + vínculo.
   */
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @SkipTenantContext()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Solicitar acesso (registro empresa + usuário)' })
  @ApiResponse({ status: 201, description: 'Solicitação enviada com sucesso' })
  @ApiResponse({ status: 409, description: 'E-mail ou CNPJ já cadastrado' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * POST /auth/logout
   * Remove cookie de autenticação e invalida hash (se possível)
   * Não exige autenticação para permitir logout mesmo com token inválido
   */
  @Post('logout')
  @SkipTenantContext()
  @Public()
  @HttpCode(HttpStatus.OK)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    // Remove o cookie independentemente do token
    response.clearCookie('auth-token');

    try {
      // Tenta extrair o token do header Authorization ou cookie
      const authHeader = request.headers.authorization;
      const token = authHeader?.replace('Bearer ', '') || request.cookies?.['auth-token'];

      if (token) {
        // Tenta decodificar o token para obter o user ID
        const decoded = this.authService.decodeToken(token);
        if (decoded && decoded.sub) {
          // Invalida o hash do usuário se possível
          await this.authService.logout(decoded.sub);
        }
      }
    } catch (error) {
      // Se houver erro ao processar o token, apenas ignora
      // O importante é que o cookie foi removido
    }

    return {
      message: 'Logout realizado com sucesso',
      success: true,
    };
  }

  /**
   * POST /auth/renew-hash
   * Renova o hash de segurança e retorna novo token
   */
  @Post('renew-hash')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthWithContextGuard)
  async renewHash(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const user = request.user as any;

    // Verifica integridade do token atual
    const isTokenValid = await this.authService.checkTokenIntegrity(user.sub, user.hash);
    if (!isTokenValid) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    const resultado = await this.authService.renewHash(user.sub);

    // Atualiza o cookie com o novo token
    response.cookie('auth-token', resultado.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });

    return {
      message: resultado.message,
      access_token: resultado.token,
    };
  }

  /**
   * GET /auth/me
   * Retorna dados do usuário autenticado
   */
  @Get('me')
  @UseGuards(JwtAuthWithContextGuard)
  async perfil(@Req() request: Request) {
    const user = request.user as any;
    return await this.authService.perfil(user.sub, user);
  }

  /**
   * GET /auth/check
   * Verifica se o usuário está autenticado e se o token é válido
   * Inclui verificação de integridade do hash
   */
  @Get('check')
  @UseGuards(JwtAuthWithContextGuard)
  async verificarAuth(@Req() request: Request) {
    const user = request.user as any;

    // Verifica integridade do token
    const isTokenValid = await this.authService.checkTokenIntegrity(user.sub, user.hash);
    if (!isTokenValid) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    return await this.authService.perfil(user.sub, user);
  }

  /**
   * GET /auth/organizations
   * Retorna organizações do usuário autenticado
   */
  @Get('organizations')
  @UseGuards(JwtAuthWithContextGuard)
  async getUserOrganizations(@Req() request: Request) {
    const user = request.user as any;

    // Verifica integridade do token
    const isTokenValid = await this.authService.checkTokenIntegrity(user.sub, user.hash);
    if (!isTokenValid) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    return await this.authService.getUserOrganizations(user.sub);
  }

  /**
   * POST /auth/switch-organization
   * Altera organização atual e retorna novo token
   */
  @Post('switch-organization')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthWithContextGuard)
  async switchOrganization(
    @Req() request: Request,
    @Body('organization_id') organizationId: string,
    @Res({ passthrough: true }) response: Response
  ) {
    const user = request.user as any;

    // Verifica integridade do token atual
    const isTokenValid = await this.authService.checkTokenIntegrity(user.sub, user.hash);
    if (!isTokenValid) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    const result = await this.authService.switchOrganization(user.sub, organizationId);

    // Atualiza cookie com novo token
    response.cookie('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: result.message,
      access_token: result.token,
    };
  }
}
