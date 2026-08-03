/**
 * A configuração inicial (primeira organização + primeiro usuário SA) pertence
 * à TELA DE SETUP do frontend, não a um seed.
 *
 * O acoplamento entre as duas pontas é indireto e frágil, e é isso que estes
 * testes protegem: o frontend só mostra `/setup` enquanto
 * `GET /auth/setup-status` responder `setupRequired: true`, e essa resposta é
 * apenas "não existe nenhuma organização". Logo, QUALQUER linha que crie uma
 * organização durante a instalação apaga a tela de setup — sem erro, sem
 * aviso: o visitante é mandado para o login de um sistema cujas credenciais
 * ele não escolheu. Era exatamente o modelo antigo, em que `install:fresh`
 * chamava `seed:admin` e a instalação nascia com a organização fictícia
 * "EZCRM" e a senha pública `admin123`.
 */
import { ForbiddenException } from '@nestjs/common';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { AuthService } from './auth.service';

describe('instalação do zero → sistema em estado "setup obrigatório"', () => {
  /**
   * Só os repositórios que o caminho de setup toca precisam ser reais o
   * bastante para observar a decisão; o resto do construtor existe para o
   * login e nunca é alcançado nestes casos.
   */
  function buildService(organizations: unknown[]) {
    const organizationRepository = {
      findAll: jest.fn().mockResolvedValue(organizations),
      findByCnpj: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    const userRepository = { findByEmail: jest.fn(), create: jest.fn() };
    const organizationUserRepository = { findByUserAndOrganization: jest.fn(), create: jest.fn() };
    const planRepository = { ensureStandardPlan: jest.fn() };
    const securityHashService = { generateHash: jest.fn() };

    const service = new AuthService(
      userRepository as never,
      organizationUserRepository as never,
      organizationRepository as never,
      planRepository as never,
      {} as never,
      securityHashService as never,
      {} as never,
      {} as never
    );

    return { service, organizationRepository, userRepository, planRepository, securityHashService };
  }

  it('banco recém-instalado (nenhuma organização) exige setup', async () => {
    const { service } = buildService([]);
    await expect(service.getSetupRequired()).resolves.toBe(true);
  });

  it('uma organização operacional já existente basta para o setup não ser mais oferecido', async () => {
    const { service } = buildService([{ id: 'qualquer-organizacao', status: 'ACTIVE' }]);
    await expect(service.getSetupRequired()).resolves.toBe(false);
  });

  it('apenas a Platform (SYSTEM) não satisfaz o setup — exige org operacional', async () => {
    const { service } = buildService([{ id: 'platform', status: 'SYSTEM' }]);
    await expect(service.getSetupRequired()).resolves.toBe(true);
  });

  it('setup num sistema já configurado é recusado ANTES de criar qualquer coisa', async () => {
    // Sem esta guarda, `POST /auth/setup` é uma rota pública que cria um
    // usuário SA_MASTER — acesso total — em qualquer instalação viva.
    const { service, organizationRepository, userRepository, planRepository } = buildService([
      { id: 'organizacao-existente', status: 'ACTIVE' },
    ]);

    await expect(
      service.runSetup({
        name: 'Invasor',
        email: 'invasor@exemplo.com',
        password: 'senha-forte',
        organization_name: 'Org do Invasor',
        cnpj: '11.222.333/0001-81',
      })
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(userRepository.create).not.toHaveBeenCalled();
    expect(organizationRepository.create).not.toHaveBeenCalled();
    expect(planRepository.ensureStandardPlan).not.toHaveBeenCalled();
  });

  it('persiste as preferências da instalação e cria o primeiro usuário como SA_MASTER', async () => {
    const { service, organizationRepository, userRepository, planRepository, securityHashService } =
      buildService([]);
    planRepository.ensureStandardPlan.mockResolvedValue({ id: 'plan-standard' });
    organizationRepository.findByCnpj.mockResolvedValue(null);
    organizationRepository.create.mockImplementation((data: Record<string, unknown>) =>
      Promise.resolve({ id: data.id ?? 'org-1', ...data })
    );
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockResolvedValue({ id: 'user-1' });
    securityHashService.generateHash.mockReturnValue('hash');
    service.login = jest.fn().mockResolvedValue({ token: 'token' });

    await service.runSetup({
      name: 'Carlos Instalador',
      email: 'carlos@empresa.com',
      password: 'SenhaForte123',
      organization_name: 'Minha Empresa',
      cnpj: '11.222.333/0001-81',
      logo_url: 'https://cdn.example.com/logo.png',
      icon_url: 'https://cdn.example.com/icon.png',
      primary_color: '#123456',
      theme: 'light',
      density: 'compact',
      locale: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      date_format: 'DD/MM/YYYY',
    });

    expect(organizationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        white_label_settings: expect.objectContaining({
          logo_url: 'https://cdn.example.com/logo.png',
          icon_url: 'https://cdn.example.com/icon.png',
          primary_color: '#123456',
          density: 'compact',
          locale: 'pt-BR',
        }),
      })
    );
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ is_super_admin: true, super_admin_role: 'SA_MASTER' })
    );
  });
});

describe('contrato do comando de instalação', () => {
  const scripts: Record<string, string> = JSON.parse(
    readFileSync(resolve(__dirname, '../../package.json'), 'utf-8')
  ).scripts;

  it('install:fresh não semeia dados — quem cria a primeira org é a tela de setup', () => {
    // Este caso fica vermelho no exato momento em que alguém "ajuda" a
    // instalação encadeando um seed aqui (era `db:recreate && seed:admin`).
    // O sintoma que ele previne não é um erro: é a tela de setup sumir.
    expect(scripts['install:fresh']).not.toMatch(/seed/);
  });
});
