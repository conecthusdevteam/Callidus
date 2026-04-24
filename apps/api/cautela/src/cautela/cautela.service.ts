import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
          gestorId: setor.gestorId,
          itens: createCautelaDto.itens.map((item) =>
            manager.getRepository(CautelaItem).create({
              nomeItem: item.nomeItem,
              quantidade: item.quantidade,
            }),
          ),
          justificativaRejeicao: null,
          proprietarioEmail: createCautelaDto.proprietarioEmail,
          proprietarioNome: createCautelaDto.proprietarioNome,
          respondidoEm: null,
          retornoItem: createCautelaDto.retornoItem,
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

    return cautelas.map((cautela) => this.serializeCautela(cautela));
  }

  async findOne(id: string, currentUser: CurrentUserPayload) {
    const cautela = await this.cautelaRepository.findOne({
      relations: {
        eventos: { feitoPor: true },
        gestor: true,
        itens: true,
        setor: { gestor: true },
        solicitadoPor: true,
      },
      where: { id },
    });

    if (!cautela) {
      throw new NotFoundException('Cautela não encontrada.');
    }

    this.ensureUserCanAccessCautela(cautela, currentUser);

    return this.serializeCautela(cautela, true);
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
      cautela.respondidoEm = new Date();

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
      cautela.respondidoEm = new Date();

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

  private serializeCautela(cautela: Cautela, includeEvents = false) {
    return {
      atualizadoEm: cautela.atualizadoEm,
      criadoEm: cautela.criadoEm,
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
          nomeItem: item.nomeItem,
          quantidade: item.quantidade,
        })) || [],
      justificativaRejeicao: cautela.justificativaRejeicao,
      proprietarioEmail: cautela.proprietarioEmail,
      proprietarioNome: cautela.proprietarioNome,
      respondidoEm: cautela.respondidoEm,
      retornoItem: cautela.retornoItem,
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
