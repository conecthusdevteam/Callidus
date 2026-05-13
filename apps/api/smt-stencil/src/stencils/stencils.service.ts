import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { CreateStencilWashDto } from './dto/create-stencil-wash.dto';
import { CreateStencilDto } from './dto/create-stencil.dto';
import { UpdateStencilDto } from './dto/update-stencil.dto';
import { Stencil } from './entities/stencil.entity';
import { StencilWash } from './entities/stencil-wash.entity';

const MANAUS_TIME_ZONE = 'America/Manaus';
const RESERVED_WASH_HOURS = [11, 16];

type StencilWashHistoryItem = {
  id: string;
  operador: string;
  created_at: Date;
  intervalo_desde_lavagem_anterior: number | null;
  fora_do_padrao: boolean;
};

type StencilMetrics = {
  total_lavagens: number;
  ultima_lavagem: Date | null;
  intervalo_medio: number | null;
  possui_anomalia: boolean;
  historico_lavagens: StencilWashHistoryItem[];
};

@Injectable()
export class StencilsService {
  constructor(
    @InjectRepository(Stencil)
    private readonly repository: Repository<Stencil>,
    @InjectRepository(StencilWash)
    private readonly washRepository: Repository<StencilWash>
  ) { }

  async create(dto: CreateStencilDto) {
    const existingStencil = await this.findByStencilCode(dto.stencilCode);
    if (existingStencil) {
      throw new ConflictException('Stencil already registered');
    }

    const stencil = this.repository.create(dto);

    return this.repository.save(stencil);
  }

  async findAll(filters?: { codigo?: string; linha?: string }) {
    const stencils = await this.repository.find({
      where: {
        ...(filters?.codigo ? { stencilCode: Like(`%${filters.codigo}%`) } : {}),
        ...(filters?.linha ? { lineName: filters.linha } : {}),
      },
      relations: {
        washes: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return stencils.map((stencil) => this.toSummary(stencil));
  }

  async findOne(id: string) {
    const stencil = await this.repository.findOne({
      where: { id },
      relations: {
        washes: true,
      },
    });

    if (!stencil) return null;

    return this.toDetail(stencil);
  }

  findByStencilCode(stencilCode: string): Promise<Stencil | null> {
    return this.repository.findOne({ where: { stencilCode } });
  }

  async findDetailByStencilCode(stencilCode: string) {
    const stencil = await this.repository.findOne({
      where: { stencilCode },
      relations: {
        washes: true,
      },
    });

    if (!stencil) return null;

    return this.toDetail(stencil);
  }

  async createWash(id: string, dto: CreateStencilWashDto) {
    const stencil = await this.repository.findOneBy({ id });
    if (!stencil) return null;

    const wash = this.washRepository.create({
      stencilId: stencil.id,
      operator: dto.operator,
      ...(dto.createdAt ? { createdAt: new Date(dto.createdAt) } : {}),
    });

    return this.washRepository.save(wash);
  }

  async createWashByStencilCode(stencilCode: string, dto: CreateStencilWashDto) {
    const stencil = await this.repository.findOneBy({ stencilCode });
    if (!stencil) return null;

    return this.createWash(stencil.id, dto);
  }

  async findLines() {
    const rows = await this.repository
      .createQueryBuilder('stencil')
      .select('DISTINCT stencil.lineName', 'linha')
      .orderBy('stencil.lineName', 'ASC')
      .getRawMany<{ linha: string }>();

    return rows.map((row) => row.linha);
  }

  async update(id: string, dto: UpdateStencilDto) {
    const stencil = await this.repository.findOneBy({ id });
    if (!stencil) return null;
    this.repository.merge(stencil, dto);
    return this.repository.save(stencil);
  }

  async remove(id: string) {
    const stencil = await this.repository.findOneBy({ id });
    if (!stencil) return null;
    return this.repository.remove(stencil);
  }

  private toSummary(stencil: Stencil) {
    const metrics = this.calculateMetrics(stencil.washes ?? []);

    return {
      id: stencil.id,
      codigo: stencil.stencilCode,
      id_fabricante: stencil.manufactureId,
      pais_origem: stencil.country,
      espessura: Number(stencil.thickness),
      enderecamento: stencil.addressing,
      status: stencil.status,
      linha: stencil.lineName,
      created_at: stencil.createdAt,
      updated_at: stencil.updatedAt,
      total_lavagens: metrics.total_lavagens,
      ultima_lavagem: metrics.ultima_lavagem,
      intervalo_medio: metrics.intervalo_medio,
      possui_anomalia: metrics.possui_anomalia,
    };
  }

  private toDetail(stencil: Stencil) {
    const metrics = this.calculateMetrics(stencil.washes ?? []);

    return {
      ...this.toSummary(stencil),
      historico_lavagens: metrics.historico_lavagens,
    };
  }

  private calculateMetrics(washes: StencilWash[]): StencilMetrics {
    const orderedAsc = [...washes].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const intervals = orderedAsc
      .map((wash, index) => {
        if (index === 0) return null;
        return this.diffMinutes(wash.createdAt, orderedAsc[index - 1].createdAt);
      })
      .filter((value): value is number => value !== null);

    const average = intervals.length > 0
      ? Math.round(intervals.reduce((sum, value) => sum + value, 0) / intervals.length)
      : null;

    const washesByManausDay = this.countWashesByManausDay(orderedAsc);

    const historyAsc = orderedAsc.map((wash, index) => {
      const interval = index === 0
        ? null
        : this.diffMinutes(wash.createdAt, orderedAsc[index - 1].createdAt);

      return {
        id: wash.id,
        operador: wash.operator,
        created_at: wash.createdAt,
        intervalo_desde_lavagem_anterior: interval,
        fora_do_padrao: this.isAnomaly(wash.createdAt, washesByManausDay),
      };
    });

    const historico_lavagens = historyAsc.reverse();

    return {
      total_lavagens: orderedAsc.length,
      ultima_lavagem: orderedAsc.at(-1)?.createdAt ?? null,
      intervalo_medio: average,
      possui_anomalia: historico_lavagens.some((wash) => wash.fora_do_padrao),
      historico_lavagens,
    };
  }

  private diffMinutes(current: Date, previous: Date) {
    return Math.round((current.getTime() - previous.getTime()) / 60000);
  }

  private isAnomaly(createdAt: Date, washesByManausDay: Map<string, number>) {
    const manausParts = this.getManausDateParts(createdAt);
    const hasMoreThanOneWashInDay = (washesByManausDay.get(manausParts.dayKey) ?? 0) > 1;
    const isOutsideReservedHours = !RESERVED_WASH_HOURS.includes(manausParts.hour);

    return hasMoreThanOneWashInDay || isOutsideReservedHours;
  }

  private countWashesByManausDay(washes: StencilWash[]) {
    return washes.reduce((acc, wash) => {
      const { dayKey } = this.getManausDateParts(wash.createdAt);
      acc.set(dayKey, (acc.get(dayKey) ?? 0) + 1);
      return acc;
    }, new Map<string, number>());
  }

  private getManausDateParts(date: Date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: MANAUS_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';

    return {
      dayKey: `${value('year')}-${value('month')}-${value('day')}`,
      hour: Number(value('hour')),
    };
  }
}
