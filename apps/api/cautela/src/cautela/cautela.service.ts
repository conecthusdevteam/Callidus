import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CautelaStatus } from '../common/enums/cautela-status.enum';
import { CautelaType } from '../common/enums/cautela-type.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUserPayload } from '../common/interfaces/current-user-payload.interface';
import { Sector } from '../sectors/entities/sector.entity';
import { User } from '../user/entities/user.entity';
import { CreateCautelaDto } from './dto/create-cautela.dto';
import { ListCautelasDto } from './dto/list-cautelas.dto';
import { RejectCautelaDto } from './dto/reject-cautela.dto';
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

  async create(currentUser: CurrentUserPayload, createCautelaDto: CreateCautelaDto) {
    this.validateCautelaInput(createCautelaDto);

    const setor = await this.sectorsRepository.findOne({
      relations: { gestor: true },
      where: { id: createCautelaDto.setorId },
    });

    if (!setor || !setor.ativo) {
      throw new BadRequestException('Setor informado não foi encontrado ou está inativo.');
    }

    if (!setor.gestor || !setor.gestor.ativo) {
      throw new BadRequestException('O setor informado não possui um gestor ativo.');
    }

    const cautela = await this.cautelaRepository.manager.transaction(
      async (manager) => {
        const createdCautela = manager.getRepository(Cautela).create({
          aprovadoEm: null,
          documentoProprietario: createCautelaDto.documentoProprietario ?? null,
          empresa: createCautelaDto.empresa ?? null,
          encerradoEm: null,
          encerradoPorId: null,
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
          retornoItem: createCautelaDto.retornoItem,
          saidaAutorizadaEm: null,
          saidaAutorizadaPorId: null,
          setorId: setor.id,
          solicitadoPorId: currentUser.sub,
          status: CautelaStatus.EM_ANALISE,
          tipo: CautelaType.EQUIPAMENTO,
          validade: createCautelaDto.validade ? new Date(createCautelaDto.validade) : null,
        });

        const savedCautela = await manager.getRepository(Cautela).save(createdCautela);
        const event = manager.getRepository(CautelaEvent).create({
          acao: CautelaStatus.EM_ANALISE,
          cautelaId: savedCautela.id,
          descricao: 'Cautela criada e encaminhada para análise do gestor responsável.',
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
      queryBuilder.andWhere('cautela.solicitadoPorId = :userId', {
        userId: currentUser.sub,
      });
    }

    if (currentUser.papel === UserRole.GESTOR) {
      queryBuilder.andWhere('cautela.gestorId = :userId', {
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
          qb.where('cautela.proprietarioNome LIKE :searchLike', { searchLike })
            .orWhere('cautela.empresa LIKE :searchLike', { searchLike });

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
      queryBuilder.andWhere('cautela.status != :pendingStatus', {
        pendingStatus: CautelaStatus.EM_ANALISE,
      });
    }

    if (filters.respondidas === false) {
      queryBuilder.andWhere('cautela.status = :pendingStatus', {
        pendingStatus: CautelaStatus.EM_ANALISE,
      });
    }

    const cautelas = await queryBuilder.getMany();

    return cautelas.map((cautela) => this.serializeCautela(cautela, false, currentUser));
  }

  async findOne(id: string, currentUser: CurrentUserPayload) {
    const cautela = await this.cautelaRepository.findOne({
      relations: {
        eventos: { feitoPor: true },
        encerradoPor: true,
        gestor: true,
        itens: true,
        saidaAutorizadaPor: true,
        setor: { gestor: true },
        solicitadoPor: true,
      },
      where: { id },
    });

    if (!cautela) {
      throw new NotFoundException('Cautela não encontrada.');
    }

    this.ensureUserCanAccessCautela(cautela, currentUser);

    return this.serializeCautela(cautela, true, currentUser);
  }

  async approve(id: string, currentUser: CurrentUserPayload) {
    const cautela = await this.cautelaRepository.findOne({
      where: { id },
    });

    if (!cautela) {
      throw new NotFoundException('Cautela não encontrada.');
    }

    this.ensureCurrentUserOwnsAnalysis(cautela, currentUser);
    this.ensureCautelaCanBeDecided(cautela);

    await this.cautelaRepository.manager.transaction(async (manager) => {
      cautela.status = CautelaStatus.APROVADA;
      cautela.justificativaRejeicao = null;
      cautela.aprovadoEm = new Date();
      cautela.rejeitadoEm = null;
      cautela.respondidoEm = cautela.aprovadoEm;

      await manager.getRepository(Cautela).save(cautela);
      await manager.getRepository(CautelaEvent).save(
        manager.getRepository(CautelaEvent).create({
          acao: CautelaStatus.APROVADA,
          cautelaId: cautela.id,
          descricao: 'Cautela aprovada pelo gestor responsável.',
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
      cautela.status = CautelaStatus.REPROVADA;
      cautela.justificativaRejeicao = rejectCautelaDto.justificativa.trim();
      cautela.aprovadoEm = null;
      cautela.rejeitadoEm = new Date();
      cautela.respondidoEm = cautela.rejeitadoEm;

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
      cautela.saidaAutorizadaEm = new Date();
      cautela.saidaAutorizadaPorId = currentUser.sub;

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
      cautela.status = CautelaStatus.ENCERRADA;
      cautela.encerradoEm = new Date();
      cautela.encerradoPorId = currentUser.sub;

      await manager.getRepository(Cautela).save(cautela);
      await manager.getRepository(CautelaEvent).save(
        manager.getRepository(CautelaEvent).create({
          acao: CautelaStatus.ENCERRADA,
          cautelaId: cautela.id,
          descricao: 'Cautela encerrada após liberação física de saída pela portaria.',
          feitoPorId: currentUser.sub,
        }),
      );
    });

    return this.findOne(id, currentUser);
  }

  private validateCautelaInput(createCautelaDto: CreateCautelaDto) {
    if (createCautelaDto.retornoItem && !createCautelaDto.validade) {
      throw new BadRequestException(
        'A data de validade é obrigatória quando o item possui retorno.',
      );
    }

    if (!createCautelaDto.retornoItem && createCautelaDto.validade) {
      throw new BadRequestException(
        'A data de validade só pode ser informada quando o item possui retorno.',
      );
    }
  }

  private ensureCurrentUserOwnsAnalysis(
    cautela: Cautela,
    currentUser: CurrentUserPayload,
  ) {
    if (currentUser.papel !== UserRole.GESTOR || cautela.gestorId !== currentUser.sub) {
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
      currentUser.papel === UserRole.PORTARIA &&
      cautela.solicitadoPorId !== currentUser.sub
    ) {
      throw new ForbiddenException('Você não pode acessar esta cautela.');
    }

    if (currentUser.papel === UserRole.GESTOR && cautela.gestorId !== currentUser.sub) {
      throw new ForbiddenException('Você não pode acessar esta cautela.');
    }
  }

  private ensureCautelaCanBeDecided(cautela: Cautela) {
    if (cautela.status !== CautelaStatus.EM_ANALISE) {
      throw new ConflictException(
        'Cautelas já respondidas não podem ser aprovadas ou reprovadas novamente.',
      );
    }
  }

  private ensureCautelaCanHaveExitAuthorized(cautela: Cautela) {
    if (cautela.status === CautelaStatus.ENCERRADA) {
      throw new ConflictException('Cautelas encerradas não podem ter saída autorizada.');
    }

    if (cautela.status !== CautelaStatus.APROVADA) {
      throw new ConflictException(
        'Apenas cautelas aprovadas podem ter saída autorizada.',
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
      throw new ConflictException('Cautelas encerradas não podem ser encerradas novamente.');
    }

    if (cautela.status !== CautelaStatus.APROVADA) {
      throw new ConflictException('Apenas cautelas aprovadas podem ser encerradas.');
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

  private getItemDescription(item: { descricao?: string; nomeItem?: string }) {
    return (item.descricao ?? item.nomeItem ?? '').trim();
  }

  private serializeCautela(
    cautela: Cautela,
    includeEvents = false,
    currentUser?: CurrentUserPayload,
  ) {
    const saidaAutorizada =
      cautela.status === CautelaStatus.APROVADA && Boolean(cautela.saidaAutorizadaEm);
    const statusVisualPortaria = saidaAutorizada ? 'ATENCAO' : cautela.status;
    const badgePortaria = saidaAutorizada ? 'ACAO_NECESSARIA' : null;
    const badgeGestor = saidaAutorizada ? 'AGUARDANDO_SAIDA' : null;
    const dataStatus =
      cautela.encerradoEm ??
      cautela.aprovadoEm ??
      cautela.rejeitadoEm ??
      cautela.criadoEm;
    const isCurrentGestor =
      currentUser?.papel === UserRole.GESTOR && cautela.gestorId === currentUser.sub;
    const isCurrentPortaria = currentUser?.papel === UserRole.PORTARIA;

    return {
      acoesDisponiveis: {
        autorizarSaida:
          isCurrentGestor &&
          cautela.status === CautelaStatus.APROVADA &&
          !cautela.saidaAutorizadaEm,
        permitirSaida:
          isCurrentPortaria &&
          saidaAutorizada &&
          cautela.saidaAutorizadaPorId !== currentUser?.sub,
      },
      atualizadoEm: cautela.atualizadoEm,
      aprovadoEm: cautela.aprovadoEm,
      badgeGestor,
      badgePortaria,
      criadoEm: cautela.criadoEm,
      dataStatus,
      documentoProprietario: cautela.documentoProprietario,
      empresa: cautela.empresa,
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
      proprietarioEmail: cautela.proprietarioEmail,
      proprietarioNome: cautela.proprietarioNome,
      rejeitadoEm: cautela.rejeitadoEm,
      respondidoEm: cautela.respondidoEm,
      retornoItem: cautela.retornoItem,
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
      validade: cautela.validade,
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
