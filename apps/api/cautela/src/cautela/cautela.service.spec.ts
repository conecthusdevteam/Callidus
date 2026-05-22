import { ConflictException } from '@nestjs/common';
import { CautelaFlowStep } from '../common/enums/cautela-flow-step.enum';
import { CautelaPermissionType } from '../common/enums/cautela-permission-type.enum';
import { CautelaStatus } from '../common/enums/cautela-status.enum';
import { CautelaType } from '../common/enums/cautela-type.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { Cautela } from './entities/cautela.entity';
import { CautelaEvent } from './entities/cautela-event.entity';
import { CautelaItem } from './entities/cautela-item.entity';
import { CautelaService } from './cautela.service';

describe('CautelaService', () => {
  const gestorUser = {
    email: 'gestor@cautela.local',
    papel: UserRole.GESTOR,
    sub: 'gestor-1',
    tokenVersion: 0,
  };

  const portariaUser = {
    email: 'portaria@cautela.local',
    papel: UserRole.PORTARIA,
    sub: 'portaria-1',
    tokenVersion: 0,
  };

  const solicitanteUser = {
    email: 'solicitante@cautela.local',
    papel: UserRole.SOLICITANTE,
    sub: 'solicitante-1',
    tokenVersion: 0,
  };

  function makeRepository() {
    return {
      create: jest.fn((entity) => entity),
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      getMany: jest.fn(),
      save: jest.fn(async (entity) => entity),
    };
  }

  function makeService() {
    const cautelaRepository = makeRepository();
    const cautelaItemRepository = makeRepository();
    const cautelaEventRepository = makeRepository();
    const sectorsRepository = makeRepository();
    const usersRepository = makeRepository();

    const repositories = new Map<unknown, ReturnType<typeof makeRepository>>([
      [Cautela, cautelaRepository],
      [CautelaItem, cautelaItemRepository],
      [CautelaEvent, cautelaEventRepository],
    ]);

    const manager = {
      getRepository: jest.fn((entity) => repositories.get(entity)),
    };

    cautelaRepository.manager = {
      transaction: jest.fn(async (callback) => callback(manager)),
    };

    const service = new CautelaService(
      cautelaRepository as never,
      cautelaItemRepository as never,
      cautelaEventRepository as never,
      sectorsRepository as never,
      usersRepository as never,
    );

    return {
      cautelaEventRepository,
      cautelaRepository,
      sectorsRepository,
      service,
    };
  }

  function makeCautela(overrides: Partial<Cautela> = {}) {
    return {
      aprovadoEm: null,
      documentoProprietario: '12345678900',
      empresa: 'Empresa Teste',
      encerradoEm: null,
      encerradoPorId: null,
      entradaValidadaEm: null,
      entradaValidadaPorId: null,
      etapaFluxo: CautelaFlowStep.SOLICITADA,
      gestorId: gestorUser.sub,
      id: 'cautela-1',
      itens: [],
      justificativaRejeicao: null,
      proprietarioEmail: 'visitante@teste.com',
      proprietarioNome: 'Visitante Teste',
      rejeitadoEm: null,
      respondidoEm: null,
      saidaAutorizadaEm: null,
      saidaAutorizadaPorId: null,
      setorId: 'setor-1',
      solicitadoPorId: solicitanteUser.sub,
      status: CautelaStatus.EM_ANALISE,
      tipo: CautelaType.EQUIPAMENTO,
      tipoPermissao: CautelaPermissionType.ENTRADA_UNICA,
      tipoPermissaoAlteradoEm: null,
      tipoPermissaoAlteradoPorId: null,
      visualizadoGestorEm: null,
      visualizadoPortariaEm: null,
      visualizadoSolicitanteEm: new Date('2026-05-22T10:00:00.000Z'),
      ...overrides,
    } as Cautela;
  }

  it('cria cautela pelo solicitante com status simples e etapa inicial do fluxo', async () => {
    const { cautelaRepository, sectorsRepository, service } = makeService();

    sectorsRepository.findOne.mockResolvedValue({
      ativo: true,
      gestor: { ativo: true },
      gestorId: gestorUser.sub,
      id: 'setor-1',
    });
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'cautela-1' });

    await service.create(solicitanteUser, {
      documentoProprietario: '12345678900',
      empresa: 'Empresa Teste',
      itens: [{ descricao: 'Notebook', quantidade: 1 }],
      proprietarioEmail: 'visitante@teste.com',
      proprietarioNome: 'Visitante Teste',
      setorId: 'setor-1',
    });

    expect(cautelaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        etapaFluxo: CautelaFlowStep.SOLICITADA,
        solicitadoPorId: solicitanteUser.sub,
        status: CautelaStatus.EM_ANALISE,
        tipoPermissao: CautelaPermissionType.ENTRADA_UNICA,
      }),
    );
  });

  it('aprova pelo gestor mantendo EM_ANALISE ate validacao da portaria', async () => {
    const { cautelaEventRepository, cautelaRepository, service } =
      makeService();
    const cautela = makeCautela();

    cautelaRepository.findOne.mockResolvedValue(cautela);
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: cautela.id });

    await service.approve(cautela.id, gestorUser, {
      tipoPermissao: CautelaPermissionType.LIVRE_TRANSITO,
    });

    expect(cautela.status).toBe(CautelaStatus.EM_ANALISE);
    expect(cautela.etapaFluxo).toBe(CautelaFlowStep.APROVADA_PELO_GESTOR);
    expect(cautela.tipoPermissao).toBe(CautelaPermissionType.LIVRE_TRANSITO);
    expect(cautela.visualizadoPortariaEm).toBeNull();
    expect(cautela.visualizadoSolicitanteEm).toBeNull();
    expect(cautelaEventRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        acao: CautelaFlowStep.APROVADA_PELO_GESTOR,
        feitoPorId: gestorUser.sub,
      }),
    );
  });

  it('valida entrada pela portaria e muda status para APROVADA', async () => {
    const { cautelaRepository, service } = makeService();
    const cautela = makeCautela({
      etapaFluxo: CautelaFlowStep.APROVADA_PELO_GESTOR,
    });

    cautelaRepository.findOne.mockResolvedValue(cautela);
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: cautela.id });

    await service.validateEntry(cautela.id, portariaUser);

    expect(cautela.status).toBe(CautelaStatus.APROVADA);
    expect(cautela.etapaFluxo).toBe(CautelaFlowStep.VALIDADA_PELA_PORTARIA);
    expect(cautela.entradaValidadaPorId).toBe(portariaUser.sub);
    expect(cautela.visualizadoSolicitanteEm).toBeNull();
  });

  it('permite portaria invalidar entrada sem justificativa obrigatoria', async () => {
    const { cautelaEventRepository, cautelaRepository, service } =
      makeService();
    const cautela = makeCautela({
      etapaFluxo: CautelaFlowStep.APROVADA_PELO_GESTOR,
    });

    cautelaRepository.findOne.mockResolvedValue(cautela);
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: cautela.id });

    await service.rejectEntryByPortaria(cautela.id, portariaUser, {});

    expect(cautela.status).toBe(CautelaStatus.REPROVADA);
    expect(cautela.justificativaRejeicao).toBeNull();
    expect(cautelaEventRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        acao: CautelaStatus.REPROVADA,
        feitoPorId: portariaUser.sub,
      }),
    );
  });

  it('bloqueia autorizacao de saida para cautela de livre transito', async () => {
    const { cautelaRepository, service } = makeService();
    const cautela = makeCautela({
      etapaFluxo: CautelaFlowStep.VALIDADA_PELA_PORTARIA,
      status: CautelaStatus.APROVADA,
      tipoPermissao: CautelaPermissionType.LIVRE_TRANSITO,
    });

    cautelaRepository.findOne.mockResolvedValue(cautela);

    await expect(service.authorizeExit(cautela.id, gestorUser)).rejects.toThrow(
      ConflictException,
    );
  });

  it('altera tipo de permissao pelo gestor sem exigir justificativa', async () => {
    const { cautelaEventRepository, cautelaRepository, service } =
      makeService();
    const cautela = makeCautela({
      etapaFluxo: CautelaFlowStep.VALIDADA_PELA_PORTARIA,
      status: CautelaStatus.APROVADA,
    });

    cautelaRepository.findOne.mockResolvedValue(cautela);
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: cautela.id });

    await service.updatePermissionType(cautela.id, gestorUser, {
      tipoPermissao: CautelaPermissionType.LIVRE_TRANSITO,
    });

    expect(cautela.tipoPermissao).toBe(CautelaPermissionType.LIVRE_TRANSITO);
    expect(cautela.tipoPermissaoAlteradoPorId).toBe(gestorUser.sub);
    expect(cautela.visualizadoPortariaEm).toBeNull();
    expect(cautela.visualizadoSolicitanteEm).toBeNull();
    expect(cautelaEventRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        acao: 'TIPO_PERMISSAO_ALTERADO',
        feitoPorId: gestorUser.sub,
      }),
    );
  });
});
