import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CautelaFlowStep } from '../common/enums/cautela-flow-step.enum';
import { CautelaPermissionType } from '../common/enums/cautela-permission-type.enum';
import { CautelaStatus } from '../common/enums/cautela-status.enum';
import { CautelaType } from '../common/enums/cautela-type.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUserPayload } from '../common/interfaces/current-user-payload.interface';
import { Sector } from '../sectors/entities/sector.entity';
import { User } from '../user/entities/user.entity';
import { ApproveCautelaDto } from './dto/approve-cautela.dto';
import { CreateCautelaDto } from './dto/create-cautela.dto';
import { ListCautelasDto } from './dto/list-cautelas.dto';
import { RejectCautelaDto } from './dto/reject-cautela.dto';
import { UpdateCautelaPermissionTypeDto } from './dto/update-cautela-permission-type.dto';
import { Cautela } from './entities/cautela.entity';
import { CautelaEvent } from './entities/cautela-event.entity';
import { CautelaItem } from './entities/cautela-item.entity';

@Injectable()
export class CautelaService {
  constructor(
    @InjectRepository(Cautela)
    private readonly cautelaRepository: Repository<Cautela>,
    @InjectRepository(CautelaItem)
    private readonly cautelaItemRepository: Repository<CautelaItem>,
    @InjectRepository(CautelaEvent)
    private readonly cautelaEventRepository: Repository<CautelaEvent>,
    @InjectRepository(Sector)
    private readonly sectorsRepository: Repository<Sector>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(
    currentUser: CurrentUserPayload,
    createCautelaDto: CreateCautelaDto,
  ) {
    const setor = await this.sectorsRepository.findOne({
      relations: { gestor: true },
      where: { id: createCautelaDto.setorId },
    });

    if (!setor || !setor.ativo) {
      throw new BadRequestException(
        'Setor informado não foi encontrado ou está inativo.',
      );
    }

    if (!setor.gestor || !setor.gestor.ativo) {
      throw new BadRequestException(
        'O setor informado não possui um gestor ativo.',
      );
    }

    const cautela = await this.cautelaRepository.manager.transaction(
      async (manager) => {
        const createdCautela = manager.getRepository(Cautela).create({
          aprovadoEm: null,
          documentoProprietario: createCautelaDto.documentoProprietario ?? null,
          empresa: createCautelaDto.empresa ?? null,
          entradaValidadaEm: null,
          entradaValidadaPorId: null,
          encerradoEm: null,
          encerradoPorId: null,
          etapaFluxo: CautelaFlowStep.SOLICITADA,
          gestorId: setor.gestorId,
          itens: createCautelaDto.itens.map((item) =>
            manager.getRepository(CautelaItem).create({
              nomeItem: this.getItemDescription(item),
              quantidade: item.quantidade,
            }),
          ),
          justificativaRejeicao: null,
          proprietarioEmail: createCautelaDto.proprietarioEmail,
          proprietarioNome: createCautelaDto.proprietarioNome,
          rejeitadoEm: null,
          respondidoEm: null,
          saidaAutorizadaEm: null,
          saidaAutorizadaPorId: null,
          setorId: setor.id,
          setor: setor,
          solicitadoPorId: currentUser.sub,
          status: CautelaStatus.EM_ANALISE,
          tipo: CautelaType.EQUIPAMENTO,
          tipoPermissao: CautelaPermissionType.ENTRADA_UNICA,
          tipoPermissaoAlteradoEm: null,
          tipoPermissaoAlteradoPorId: null,
          visualizadoGestorEm: null,
          visualizadoPortariaEm: null,
          visualizadoSolicitanteEm: new Date(),
        });

        const savedCautela = await manager
          .getRepository(Cautela)
          .save(createdCautela);
        const event = manager.getRepository(CautelaEvent).create({
          acao: CautelaStatus.EM_ANALISE,
          cautelaId: savedCautela.id,
          descricao:
            'Cautela solicitada e encaminhada para análise do gestor responsável.',
          feitoPorId: currentUser.sub,
        });

        await manager.getRepository(CautelaEvent).save(event);

        return savedCautela;
      },
    );

    return this.findOne(cautela.id, currentUser);
  }

  async findAll(currentUser: CurrentUserPayload, filters: ListCautelasDto) {
    const queryBuilder = this.cautelaRepository
      .createQueryBuilder('cautela')
      .leftJoinAndSelect('cautela.setor', 'setor')
      .leftJoinAndSelect('setor.gestor', 'setorGestor')
      .leftJoinAndSelect('cautela.solicitadoPor', 'solicitadoPor')
      .leftJoinAndSelect('cautela.gestor', 'gestor')
      .leftJoinAndSelect('cautela.itens', 'itens')
      .orderBy('cautela.criadoEm', 'DESC');

    if (currentUser.papel === UserRole.PORTARIA) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where(
            'cautela.status = :pendingStatus AND cautela.etapaFluxo = :managerApprovedStep',
            {
              managerApprovedStep: CautelaFlowStep.APROVADA_PELO_GESTOR,
              pendingStatus: CautelaStatus.EM_ANALISE,
            },
          )
            .orWhere(
              'cautela.status = :approvedStatus AND cautela.etapaFluxo = :exitAuthorizedStep',
              {
                approvedStatus: CautelaStatus.APROVADA,
                exitAuthorizedStep:
                  CautelaFlowStep.SAIDA_AUTORIZADA_PELO_GESTOR,
              },
            )
            .orWhere('cautela.status IN (:...historyStatuses)', {
              historyStatuses: [
                CautelaStatus.APROVADA,
                CautelaStatus.REPROVADA,
                CautelaStatus.ENCERRADA,
              ],
            });
        }),
      );
    }

    if (currentUser.papel === UserRole.GESTOR) {
      queryBuilder.andWhere('cautela.gestorId = :userId', {
        userId: currentUser.sub,
      });
    }

    if (currentUser.papel === UserRole.SOLICITANTE) {
      queryBuilder.andWhere('cautela.solicitadoPorId = :userId', {
        userId: currentUser.sub,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('cautela.status = :status', {
        status: filters.status,
      });
    }

    if (filters.setorId) {
      queryBuilder.andWhere('cautela.setorId = :setorId', {
        setorId: filters.setorId,
      });
    }

    if (filters.updatedSince) {
      queryBuilder.andWhere('cautela.atualizadoEm >= :updatedSince', {
        updatedSince: new Date(filters.updatedSince),
      });
    }

    if (filters.search?.trim()) {
      const search = filters.search.trim();
      const searchLike = `%${search}%`;
      const isUuidSearch =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          search,
        );
      const statusMatch = Object.values(CautelaStatus).find(
        (status) => status.toLowerCase() === search.toLowerCase(),
      );

      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('cautela.proprietarioNome LIKE :searchLike', {
            searchLike,
          }).orWhere('cautela.empresa LIKE :searchLike', { searchLike });

          if (isUuidSearch) {
            qb.orWhere('cautela.id = :exactSearch', { exactSearch: search });
          }

          if (statusMatch) {
            qb.orWhere('cautela.status = :searchStatus', {
              searchStatus: statusMatch,
            });
          }
        }),
      );
    }

    if (filters.respondidas === true) {
      if (currentUser.papel === UserRole.GESTOR) {
        queryBuilder.andWhere('cautela.etapaFluxo != :solicitadaStep', {
          solicitadaStep: CautelaFlowStep.SOLICITADA,
        });
      } else if (currentUser.papel === UserRole.PORTARIA) {
        queryBuilder.andWhere('cautela.etapaFluxo != :managerApprovedStep', {
          managerApprovedStep: CautelaFlowStep.APROVADA_PELO_GESTOR,
        });
      } else {
        queryBuilder.andWhere('cautela.status != :pendingStatus', {
          pendingStatus: CautelaStatus.EM_ANALISE,
        });
      }
    }

    if (filters.respondidas === false) {
      if (currentUser.papel === UserRole.GESTOR) {
        queryBuilder.andWhere('cautela.etapaFluxo = :solicitadaStep', {
          solicitadaStep: CautelaFlowStep.SOLICITADA,
        });
      } else if (currentUser.papel === UserRole.PORTARIA) {
        queryBuilder.andWhere('cautela.etapaFluxo = :managerApprovedStep', {
          managerApprovedStep: CautelaFlowStep.APROVADA_PELO_GESTOR,
        });
      } else {
        queryBuilder.andWhere('cautela.status = :pendingStatus', {
          pendingStatus: CautelaStatus.EM_ANALISE,
        });
      }
    }

    const cautelas = await queryBuilder.getMany();

    return cautelas.map((cautela) =>
      this.serializeCautela(cautela, false, currentUser),
    );
  }

  async findOne(id: string, currentUser: CurrentUserPayload) {
    const cautela = await this.cautelaRepository.findOne({
      relations: {
        eventos: { feitoPor: true },
        entradaValidadaPor: true,
        encerradoPor: true,
        gestor: true,
        itens: true,
        saidaAutorizadaPor: true,
        setor: { gestor: true },
        solicitadoPor: true,
        tipoPermissaoAlteradoPor: true,
      },
      where: { id },
    });

    if (!cautela) {
      throw new NotFoundException('Cautela não encontrada.');
    }

    this.ensureUserCanAccessCautela(cautela, currentUser);

    return this.serializeCautela(cautela, true, currentUser);
  }

  async approve(
    id: string,
    currentUser: CurrentUserPayload,
    approveCautelaDto: ApproveCautelaDto = {},
  ) {
    const cautela = await this.cautelaRepository.findOne({
      where: { id },
    });

    if (!cautela) {
      throw new NotFoundException('Cautela não encontrada.');
    }

    this.ensureCurrentUserOwnsAnalysis(cautela, currentUser);
    this.ensureCautelaCanBeDecided(cautela);

    await this.cautelaRepository.manager.transaction(async (manager) => {
      const approvedAt = new Date();

      cautela.status = CautelaStatus.EM_ANALISE;
      cautela.etapaFluxo = CautelaFlowStep.APROVADA_PELO_GESTOR;
      cautela.justificativaRejeicao = null;
      cautela.aprovadoEm = approvedAt;
      cautela.rejeitadoEm = null;
      cautela.respondidoEm = cautela.aprovadoEm;
      cautela.tipoPermissao =
        approveCautelaDto.tipoPermissao ?? CautelaPermissionType.ENTRADA_UNICA;
      cautela.visualizadoGestorEm = approvedAt;
      cautela.visualizadoPortariaEm = null;
      cautela.visualizadoSolicitanteEm = null;

      await manager.getRepository(Cautela).save(cautela);
      await manager.getRepository(CautelaEvent).save(
        manager.getRepository(CautelaEvent).create({
          acao: CautelaFlowStep.APROVADA_PELO_GESTOR,
          cautelaId: cautela.id,
          descricao: `Cautela aprovada pelo gestor responsável com permissão ${cautela.tipoPermissao}.`,
          feitoPorId: currentUser.sub,
        }),
      );
    });

    return this.findOne(id, currentUser);
  }

  async reject(
    id: string,
    currentUser: CurrentUserPayload,
    rejectCautelaDto: RejectCautelaDto,
  ) {
    const cautela = await this.cautelaRepository.findOne({
      where: { id },
    });

    if (!cautela) {
      throw new NotFoundException('Cautela não encontrada.');
    }

    this.ensureCurrentUserOwnsAnalysis(cautela, currentUser);
    this.ensureCautelaCanBeDecided(cautela);

    await this.cautelaRepository.manager.transaction(async (manager) => {
      const rejectedAt = new Date();

      cautela.status = CautelaStatus.REPROVADA;
      cautela.etapaFluxo = CautelaFlowStep.REPROVADA;
      cautela.justificativaRejeicao = rejectCautelaDto.justificativa.trim();
      cautela.aprovadoEm = null;
      cautela.rejeitadoEm = rejectedAt;
      cautela.respondidoEm = cautela.rejeitadoEm;
      cautela.visualizadoGestorEm = rejectedAt;
      cautela.visualizadoSolicitanteEm = null;

      await manager.getRepository(Cautela).save(cautela);
      await manager.getRepository(CautelaEvent).save(
        manager.getRepository(CautelaEvent).create({
          acao: CautelaStatus.REPROVADA,
          cautelaId: cautela.id,
          descricao: `Cautela reprovada. Motivo: ${rejectCautelaDto.justificativa.trim()}`,
          feitoPorId: currentUser.sub,
        }),
      );
    });

    return this.findOne(id, currentUser);
  }

  async validateEntry(id: string, currentUser: CurrentUserPayload) {
    const cautela = await this.cautelaRepository.findOne({
      where: { id },
    });

    if (!cautela) {
      throw new NotFoundException('Cautela não encontrada.');
    }

    this.ensureCautelaCanBeValidatedByPortaria(cautela, currentUser);

    await this.cautelaRepository.manager.transaction(async (manager) => {
      const validatedAt = new Date();

      cautela.status = CautelaStatus.APROVADA;
      cautela.etapaFluxo = CautelaFlowStep.VALIDADA_PELA_PORTARIA;
      cautela.entradaValidadaEm = validatedAt;
      cautela.entradaValidadaPorId = currentUser.sub;
      cautela.visualizadoPortariaEm = validatedAt;
      cautela.visualizadoSolicitanteEm = null;

      await manager.getRepository(Cautela).save(cautela);
      await manager.getRepository(CautelaEvent).save(
        manager.getRepository(CautelaEvent).create({
          acao: CautelaFlowStep.VALIDADA_PELA_PORTARIA,
          cautelaId: cautela.id,
          descricao: 'Entrada da cautela validada pela portaria.',
          feitoPorId: currentUser.sub,
        }),
      );
    });

    return this.findOne(id, currentUser);
  }

  async authorizeExit(id: string, currentUser: CurrentUserPayload) {
    const cautela = await this.cautelaRepository.findOne({
      where: { id },
    });

    if (!cautela) {
      throw new NotFoundException('Cautela não encontrada.');
    }

    this.ensureCurrentUserOwnsAnalysis(cautela, currentUser);
    this.ensureCautelaCanHaveExitAuthorized(cautela);

    await this.cautelaRepository.manager.transaction(async (manager) => {
      const exitAuthorizedAt = new Date();

      cautela.etapaFluxo = CautelaFlowStep.SAIDA_AUTORIZADA_PELO_GESTOR;
      cautela.saidaAutorizadaEm = exitAuthorizedAt;
      cautela.saidaAutorizadaPorId = currentUser.sub;
      cautela.visualizadoGestorEm = exitAuthorizedAt;
      cautela.visualizadoPortariaEm = null;
      cautela.visualizadoSolicitanteEm = null;

      await manager.getRepository(Cautela).save(cautela);
      await manager.getRepository(CautelaEvent).save(
        manager.getRepository(CautelaEvent).create({
          acao: 'SAIDA_AUTORIZADA',
          cautelaId: cautela.id,
          descricao: 'Saída da cautela autorizada pelo gestor responsável.',
          feitoPorId: currentUser.sub,
        }),
      );
    });

    return this.findOne(id, currentUser);
  }

  async closeAfterExit(id: string, currentUser: CurrentUserPayload) {
    const cautela = await this.cautelaRepository.findOne({
      where: { id },
    });

    if (!cautela) {
      throw new NotFoundException('Cautela não encontrada.');
    }

    this.ensureCautelaCanBeClosedAfterExit(cautela, currentUser);

    await this.cautelaRepository.manager.transaction(async (manager) => {
      const closedAt = new Date();

      cautela.status = CautelaStatus.ENCERRADA;
      cautela.etapaFluxo = CautelaFlowStep.ENCERRADA_PELA_PORTARIA;
      cautela.encerradoEm = closedAt;
      cautela.encerradoPorId = currentUser.sub;
      cautela.visualizadoPortariaEm = closedAt;
      cautela.visualizadoSolicitanteEm = null;

      await manager.getRepository(Cautela).save(cautela);
      await manager.getRepository(CautelaEvent).save(
        manager.getRepository(CautelaEvent).create({
          acao: CautelaStatus.ENCERRADA,
          cautelaId: cautela.id,
          descricao:
            'Cautela encerrada após liberação física de saída pela portaria.',
          feitoPorId: currentUser.sub,
        }),
      );
    });

    return this.findOne(id, currentUser);
  }

  async updatePermissionType(
    id: string,
    currentUser: CurrentUserPayload,
    updateCautelaPermissionTypeDto: UpdateCautelaPermissionTypeDto,
  ) {
    const cautela = await this.cautelaRepository.findOne({
      where: { id },
    });

    if (!cautela) {
      throw new NotFoundException('Cautela não encontrada.');
    }

    this.ensureCurrentUserOwnsAnalysis(cautela, currentUser);
    this.ensureCautelaCanHavePermissionTypeChanged(cautela);

    const previousPermissionType =
      cautela.tipoPermissao ?? CautelaPermissionType.ENTRADA_UNICA;
    const nextPermissionType = updateCautelaPermissionTypeDto.tipoPermissao;

    if (previousPermissionType === nextPermissionType) {
      return this.findOne(id, currentUser);
    }

    await this.cautelaRepository.manager.transaction(async (manager) => {
      const changedAt = new Date();

      cautela.tipoPermissao = nextPermissionType;
      cautela.tipoPermissaoAlteradoEm = changedAt;
      cautela.tipoPermissaoAlteradoPorId = currentUser.sub;
      cautela.visualizadoGestorEm = changedAt;
      cautela.visualizadoPortariaEm = null;
      cautela.visualizadoSolicitanteEm = null;

      await manager.getRepository(Cautela).save(cautela);
      await manager.getRepository(CautelaEvent).save(
        manager.getRepository(CautelaEvent).create({
          acao: 'TIPO_PERMISSAO_ALTERADO',
          cautelaId: cautela.id,
          descricao: `Tipo de permissão alterado de ${previousPermissionType} para ${nextPermissionType}.`,
          feitoPorId: currentUser.sub,
        }),
      );
    });

    return this.findOne(id, currentUser);
  }

  async markAsRead(id: string, currentUser: CurrentUserPayload) {
    const cautela = await this.cautelaRepository.findOne({
      where: { id },
    });

    if (!cautela) {
      throw new NotFoundException('Cautela não encontrada.');
    }

    this.ensureUserCanAccessCautela(cautela, currentUser);

    const readAt = new Date();

    if (currentUser.papel === UserRole.GESTOR) {
      cautela.visualizadoGestorEm = readAt;
    }

    if (currentUser.papel === UserRole.PORTARIA) {
      cautela.visualizadoPortariaEm = readAt;
    }

    if (currentUser.papel === UserRole.SOLICITANTE) {
      cautela.visualizadoSolicitanteEm = readAt;
    }

    await this.cautelaRepository.save(cautela);

    return this.findOne(id, currentUser);
  }

  private ensureCurrentUserOwnsAnalysis(
    cautela: Cautela,
    currentUser: CurrentUserPayload,
  ) {
    if (
      currentUser.papel !== UserRole.GESTOR ||
      cautela.gestorId !== currentUser.sub
    ) {
      throw new ForbiddenException(
        'Apenas o gestor responsável pelo setor pode decidir esta cautela.',
      );
    }
  }

  private ensureUserCanAccessCautela(
    cautela: Cautela,
    currentUser: CurrentUserPayload,
  ) {
    if (currentUser.papel === UserRole.ADMIN) {
      return;
    }

    if (
      currentUser.papel === UserRole.SOLICITANTE &&
      cautela.solicitadoPorId !== currentUser.sub
    ) {
      throw new ForbiddenException('Você não pode acessar esta cautela.');
    }

    if (
      currentUser.papel === UserRole.GESTOR &&
      cautela.gestorId !== currentUser.sub
    ) {
      throw new ForbiddenException('Você não pode acessar esta cautela.');
    }
  }

  private ensureCautelaCanBeDecided(cautela: Cautela) {
    if (
      cautela.status !== CautelaStatus.EM_ANALISE ||
      cautela.etapaFluxo !== CautelaFlowStep.SOLICITADA
    ) {
      throw new ConflictException(
        'Apenas cautelas solicitadas e pendentes do gestor podem ser aprovadas ou reprovadas.',
      );
    }
  }

  private ensureCautelaCanBeValidatedByPortaria(
    cautela: Cautela,
    currentUser: CurrentUserPayload,
  ) {
    if (currentUser.papel !== UserRole.PORTARIA) {
      throw new ForbiddenException('Apenas a portaria pode validar a entrada.');
    }

    if (
      cautela.status !== CautelaStatus.EM_ANALISE ||
      cautela.etapaFluxo !== CautelaFlowStep.APROVADA_PELO_GESTOR
    ) {
      throw new ConflictException(
        'Apenas cautelas aprovadas pelo gestor e aguardando portaria podem ser validadas.',
      );
    }
  }

  private ensureCautelaCanHaveExitAuthorized(cautela: Cautela) {
    if (cautela.status === CautelaStatus.ENCERRADA) {
      throw new ConflictException(
        'Cautelas encerradas não podem ter saída autorizada.',
      );
    }

    if (cautela.status !== CautelaStatus.APROVADA) {
      throw new ConflictException(
        'Apenas cautelas aprovadas pela portaria podem ter saída autorizada.',
      );
    }

    if (cautela.tipoPermissao === CautelaPermissionType.LIVRE_TRANSITO) {
      throw new ConflictException(
        'Cautelas de livre trânsito não possuem fluxo de saída. Altere para entrada única antes de autorizar a saída.',
      );
    }

    if (cautela.saidaAutorizadaEm) {
      throw new ConflictException('A saída desta cautela já foi autorizada.');
    }
  }

  private ensureCautelaCanBeClosedAfterExit(
    cautela: Cautela,
    currentUser: CurrentUserPayload,
  ) {
    if (currentUser.papel !== UserRole.PORTARIA) {
      throw new ForbiddenException('Apenas a portaria pode permitir a saída.');
    }

    if (cautela.status === CautelaStatus.ENCERRADA) {
      throw new ConflictException(
        'Cautelas encerradas não podem ser encerradas novamente.',
      );
    }

    if (cautela.status !== CautelaStatus.APROVADA) {
      throw new ConflictException(
        'Apenas cautelas aprovadas podem ser encerradas.',
      );
    }

    if (cautela.tipoPermissao === CautelaPermissionType.LIVRE_TRANSITO) {
      throw new ConflictException(
        'Cautelas de livre trânsito não possuem fluxo de saída para encerramento.',
      );
    }

    if (!cautela.saidaAutorizadaEm || !cautela.saidaAutorizadaPorId) {
      throw new ConflictException(
        'A cautela precisa ter saída autorizada pelo gestor antes do encerramento.',
      );
    }

    if (cautela.saidaAutorizadaPorId === currentUser.sub) {
      throw new ForbiddenException(
        'Quem autoriza a saída não pode registrar a saída física da cautela.',
      );
    }
  }

  private ensureCautelaCanHavePermissionTypeChanged(cautela: Cautela) {
    if (
      cautela.status === CautelaStatus.ENCERRADA ||
      cautela.status === CautelaStatus.REPROVADA
    ) {
      throw new ConflictException(
        'Cautelas encerradas ou reprovadas não podem ter o tipo de permissão alterado.',
      );
    }
  }

  private getItemDescription(item: { descricao?: string; nomeItem?: string }) {
    return (item.descricao ?? item.nomeItem ?? '').trim();
  }

  private serializeCautela(
    cautela: Cautela,
    includeEvents = false,
    currentUser?: CurrentUserPayload,
  ) {
    const saidaAutorizada =
      cautela.status === CautelaStatus.APROVADA &&
      cautela.tipoPermissao !== CautelaPermissionType.LIVRE_TRANSITO &&
      Boolean(cautela.saidaAutorizadaEm);
    const aguardandoValidacaoEntrada =
      cautela.status === CautelaStatus.EM_ANALISE &&
      cautela.etapaFluxo === CautelaFlowStep.APROVADA_PELO_GESTOR;
    const statusVisualPortaria = saidaAutorizada
      ? 'ATENCAO'
      : aguardandoValidacaoEntrada
        ? 'AUTORIZADO_A_ENTRAR'
        : cautela.status;
    const badgePortaria =
      saidaAutorizada && !cautela.visualizadoPortariaEm
        ? 'AUTORIZADO_A_SAIR'
        : aguardandoValidacaoEntrada && !cautela.visualizadoPortariaEm
          ? 'AUTORIZADO_A_ENTRAR'
          : cautela.tipoPermissaoAlteradoEm && !cautela.visualizadoPortariaEm
            ? 'TIPO_PERMISSAO_EDITADO'
            : null;
    const badgeGestor = saidaAutorizada
      ? 'AGUARDANDO_SAIDA'
      : cautela.etapaFluxo === CautelaFlowStep.SOLICITADA &&
          !cautela.visualizadoGestorEm
        ? 'NOVA_CAUTELA_SOLICITADA'
        : null;
    const badgeSolicitante = !cautela.visualizadoSolicitanteEm
      ? cautela.tipoPermissaoAlteradoEm
        ? `EDITADA_EM_${cautela.tipoPermissaoAlteradoEm.toISOString()}`
        : 'NOVO'
      : null;
    const dataStatus =
      cautela.encerradoEm ??
      cautela.entradaValidadaEm ??
      cautela.aprovadoEm ??
      cautela.rejeitadoEm ??
      cautela.criadoEm;
    const isCurrentGestor =
      currentUser?.papel === UserRole.GESTOR &&
      cautela.gestorId === currentUser.sub;
    const isCurrentPortaria = currentUser?.papel === UserRole.PORTARIA;

    return {
      acoesDisponiveis: {
        aprovar:
          isCurrentGestor &&
          cautela.status === CautelaStatus.EM_ANALISE &&
          cautela.etapaFluxo === CautelaFlowStep.SOLICITADA,
        autorizarSaida:
          isCurrentGestor &&
          cautela.status === CautelaStatus.APROVADA &&
          cautela.tipoPermissao === CautelaPermissionType.ENTRADA_UNICA &&
          !cautela.saidaAutorizadaEm,
        permitirSaida:
          isCurrentPortaria &&
          saidaAutorizada &&
          cautela.saidaAutorizadaPorId !== currentUser?.sub,
        reprovar:
          isCurrentGestor &&
          cautela.status === CautelaStatus.EM_ANALISE &&
          cautela.etapaFluxo === CautelaFlowStep.SOLICITADA,
        alterarTipoPermissao:
          isCurrentGestor &&
          cautela.status !== CautelaStatus.ENCERRADA &&
          cautela.status !== CautelaStatus.REPROVADA,
        validarEntrada: isCurrentPortaria && aguardandoValidacaoEntrada,
      },
      atualizadoEm: cautela.atualizadoEm,
      aprovadoEm: cautela.aprovadoEm,
      badgeGestor,
      badgePortaria,
      criadoEm: cautela.criadoEm,
      dataStatus,
      documentoProprietario: cautela.documentoProprietario,
      empresa: cautela.empresa,
      entradaValidadaEm: cautela.entradaValidadaEm,
      entradaValidadaPor: cautela.entradaValidadaPor
        ? {
            email: cautela.entradaValidadaPor.email,
            id: cautela.entradaValidadaPor.id,
            nome: cautela.entradaValidadaPor.nome,
            papel: cautela.entradaValidadaPor.papel,
          }
        : null,
      entradaValidadaPorId: cautela.entradaValidadaPorId,
      encerradoEm: cautela.encerradoEm,
      encerradoPor: cautela.encerradoPor
        ? {
            email: cautela.encerradoPor.email,
            id: cautela.encerradoPor.id,
            nome: cautela.encerradoPor.nome,
            papel: cautela.encerradoPor.papel,
          }
        : null,
      encerradoPorId: cautela.encerradoPorId,
      gestor: cautela.gestor
        ? {
            email: cautela.gestor.email,
            id: cautela.gestor.id,
            nome: cautela.gestor.nome,
            papel: cautela.gestor.papel,
          }
        : null,
      gestorId: cautela.gestorId,
      id: cautela.id,
      customId: cautela.customId,
      etapaFluxo: cautela.etapaFluxo,
      itens:
        cautela.itens?.map((item) => ({
          atualizadoEm: item.atualizadoEm,
          criadoEm: item.criadoEm,
          id: item.id,
          descricao: item.nomeItem,
          nomeItem: item.nomeItem,
          quantidade: item.quantidade,
        })) || [],
      justificativaRejeicao: cautela.justificativaRejeicao,
      badgeSolicitante,
      proprietarioEmail: cautela.proprietarioEmail,
      proprietarioNome: cautela.proprietarioNome,
      rejeitadoEm: cautela.rejeitadoEm,
      respondidoEm: cautela.respondidoEm,
      saidaAutorizada,
      saidaAutorizadaEm: cautela.saidaAutorizadaEm,
      saidaAutorizadaPor: cautela.saidaAutorizadaPor
        ? {
            email: cautela.saidaAutorizadaPor.email,
            id: cautela.saidaAutorizadaPor.id,
            nome: cautela.saidaAutorizadaPor.nome,
            papel: cautela.saidaAutorizadaPor.papel,
          }
        : null,
      saidaAutorizadaPorId: cautela.saidaAutorizadaPorId,
      setor: cautela.setor
        ? {
            ativo: cautela.setor.ativo,
            gestorId: cautela.setor.gestorId,
            id: cautela.setor.id,
            nome: cautela.setor.nome,
            numeroSetor: cautela.setor.numeroSetor,
          }
        : null,
      setorId: cautela.setorId,
      solicitadoPor: cautela.solicitadoPor
        ? {
            email: cautela.solicitadoPor.email,
            id: cautela.solicitadoPor.id,
            nome: cautela.solicitadoPor.nome,
            papel: cautela.solicitadoPor.papel,
          }
        : null,
      solicitadoPorId: cautela.solicitadoPorId,
      status: cautela.status,
      statusVisualGestor: cautela.status,
      statusVisualPortaria,
      tipo: cautela.tipo,
      tipoPermissao: cautela.tipoPermissao,
      tipoPermissaoAlteradoEm: cautela.tipoPermissaoAlteradoEm,
      tipoPermissaoAlteradoPor: cautela.tipoPermissaoAlteradoPor
        ? {
            email: cautela.tipoPermissaoAlteradoPor.email,
            id: cautela.tipoPermissaoAlteradoPor.id,
            nome: cautela.tipoPermissaoAlteradoPor.nome,
            papel: cautela.tipoPermissaoAlteradoPor.papel,
          }
        : null,
      tipoPermissaoAlteradoPorId: cautela.tipoPermissaoAlteradoPorId,
      visualizadoGestorEm: cautela.visualizadoGestorEm,
      visualizadoPortariaEm: cautela.visualizadoPortariaEm,
      visualizadoSolicitanteEm: cautela.visualizadoSolicitanteEm,
      ...(includeEvents
        ? {
            eventos:
              cautela.eventos?.map((event) => ({
                acao: event.acao,
                descricao: event.descricao,
                feitoPor: event.feitoPor
                  ? {
                      email: event.feitoPor.email,
                      id: event.feitoPor.id,
                      nome: event.feitoPor.nome,
                      papel: event.feitoPor.papel,
                    }
                  : null,
                feitoPorId: event.feitoPorId,
                id: event.id,
                timestamp: event.timestamp,
              })) || [],
          }
        : {}),
    };
  }
}
