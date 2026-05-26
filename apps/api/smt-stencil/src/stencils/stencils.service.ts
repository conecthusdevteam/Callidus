import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { CreateStencilWashDto } from './dto/create-stencil-wash.dto';
import { CreateStencilDto } from './dto/create-stencil.dto';
import { UpdateStencilDto } from './dto/update-stencil.dto';
import { StencilWash } from './entities/stencil-wash.entity';
import { Stencil, WashStatus } from './entities/stencil.entity';

const MANAUS_TIME_ZONE = 'America/Manaus';
const MANAUS_UTC_OFFSET_HOURS = 4;
const RESERVED_WASH_HOURS = [11, 16];

type StencilWashHistoryItem = {
  id: string;
  operator: string;
  created_at: Date;
  previous_wash_interval: number | null;
  non_standard: boolean;
};

type StencilMetrics = {
  total_washes: number;
  last_wash: Date | null;
  last_wash_details: StencilWashHistoryItem | null;
  mid_range: number | null;
  anomaly: boolean;
  washes_history: StencilWashHistoryItem[];
};

type StencilFilters = {
  stencilCode?: string;
  manufactureId?: string;
  country?: string;
  status?: string;
  lineName?: string;
  page?: number;
  limit?: number;
};

type RecentStencilWashFilters = {
  page?: number;
  limit?: number;
  attentionOnly?: boolean;
};

@Injectable()
export class StencilsService {
  constructor(
    @InjectRepository(Stencil)
    private readonly repository: Repository<Stencil>,
    @InjectRepository(StencilWash)
    private readonly washRepository: Repository<StencilWash>,
  ) { }

  async create(dto: CreateStencilDto) {
    const existingStencil = await this.findByStencilCode(dto.stencilCode);
    if (existingStencil) {
      throw new ConflictException('Stencil already registered');
    }

    const stencil = this.repository.create(dto);

    return this.repository.save(stencil);
  }

  async findAll(filters?: StencilFilters) {
    const stencils = await this.repository.find({
      where: {
        ...(filters?.stencilCode
          ? { stencilCode: Like(`%${filters.stencilCode}%`) }
          : {}),
        ...(filters?.manufactureId
          ? { manufactureId: Like(`%${filters.manufactureId}%`) }
          : {}),
        ...(filters?.country
          ? { country: Like(`%${filters.country}%`) }
          : {}),
        ...(filters?.status ? { status: filters.status as WashStatus } : {}),
        ...(filters?.lineName ? { lineName: filters.lineName } : {}),
      },
      relations: {
        washes: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    const items = stencils.map((stencil) => this.toSummary(stencil));

    return this.paginateIfRequested(items, filters?.page, filters?.limit);
  }

  async findTodayStencilWashes(filters?: StencilFilters) {
    const { startUtc, endUtc } = this.getManausDayRange(new Date());

    const queryBuilder = this.washRepository
      .createQueryBuilder('wash')
      .leftJoinAndSelect('wash.stencil', 'stencil')
      .where('wash.createdAt BETWEEN :startOfDay AND :endOfDay', {
        startOfDay: startUtc,
        endOfDay: endUtc,
      });

    if (filters?.stencilCode) {
      queryBuilder.andWhere('stencil.stencilCode LIKE :stencilCode', {
        stencilCode: `%${filters.stencilCode}%`,
      });
    }

    if (filters?.manufactureId) {
      queryBuilder.andWhere('stencil.manufactureId LIKE :manufactureId', {
        manufactureId: `%${filters.manufactureId}%`,
      });
    }

    if (filters?.country) {
      queryBuilder.andWhere('stencil.country LIKE :country', {
        country: `%${filters.country}%`,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('stencil.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.lineName) {
      queryBuilder.andWhere('stencil.lineName = :lineName', {
        lineName: filters.lineName,
      });
    }

    queryBuilder.orderBy('wash.createdAt', 'DESC');

    if (filters?.page && filters?.limit) { 
      const skip = (filters.page - 1) * filters.limit;
      queryBuilder.skip(skip).take(filters.limit);
    } 

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page: filters?.page || 1,
        limit: filters?.limit || total,
        total_pages: filters?.limit ? Math.ceil(total / filters.limit) : 1,
      },
    };
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

  async createWashByStencilCode(
    stencilCode: string,
    dto: CreateStencilWashDto,
  ) {
    const stencil = await this.repository.findOneBy({ stencilCode });
    if (!stencil) return null;

    return this.createWash(stencil.id, dto);
  }

  async findRecentWashes(filters?: RecentStencilWashFilters) {
    const stencils = await this.repository.find({
      relations: {
        washes: true,
      },
    });

    const items = stencils
      .flatMap((stencil) => {
        const metrics = this.calculateMetrics(stencil.washes ?? []);

        return metrics.washes_history.map((wash) => ({
          id: wash.id,
          stencil_id: stencil.id,
          created_at: wash.created_at,
          stencil_code: stencil.stencilCode,
          addressing: String(stencil.addressing).padStart(3, '0'),
          status: stencil.status,
          line_name: stencil.lineName,
          operator: wash.operator,
          previous_wash_interval: wash.previous_wash_interval,
          non_standard: wash.non_standard,
        }));
      })
      .filter((wash) => !filters?.attentionOnly || wash.non_standard)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    return this.paginate(items, filters?.page, filters?.limit);
  }

  async findLines() {
    const rows = await this.repository
      .createQueryBuilder('stencil')
      .select('DISTINCT stencil.lineName')
      .orderBy('stencil.lineName', 'ASC')
      .getRawMany<{ lineName: string }>();

    return rows.map((row) => row.lineName);
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
      stencilCode: stencil.stencilCode,
      manufacture_id: stencil.manufactureId,
      country: stencil.country,
      thickness: Number(stencil.thickness),
      eddressing: stencil.addressing,
      status: stencil.status,
      line_name: stencil.lineName,
      created_at: stencil.createdAt,
      updated_at: stencil.updatedAt,
      total_washes: metrics.total_washes,
      last_wash: metrics.last_wash,
      last_wash_details: metrics.last_wash_details,
      mid_range: metrics.mid_range,
      anomaly: metrics.anomaly,
    };
  }

  private toDetail(stencil: Stencil) {
    const metrics = this.calculateMetrics(stencil.washes ?? []);

    return {
      ...this.toSummary(stencil),
      washes_history: metrics.washes_history,
    };
  }

  private calculateMetrics(washes: StencilWash[]): StencilMetrics {
    const orderedAsc = [...washes].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    const intervals = orderedAsc
      .map((wash, index) => {
        if (index === 0) return null;
        return this.diffMinutes(
          wash.createdAt,
          orderedAsc[index - 1].createdAt,
        );
      })
      .filter((value): value is number => value !== null);

    const average =
      intervals.length > 0
        ? Math.round(
          intervals.reduce((sum, value) => sum + value, 0) / intervals.length,
        )
        : null;

    const washesByManausDay = this.countWashesByManausDay(orderedAsc);

    const historyAsc = orderedAsc.map((wash, index) => {
      const interval =
        index === 0
          ? null
          : this.diffMinutes(wash.createdAt, orderedAsc[index - 1].createdAt);

      return {
        id: wash.id,
        operator: wash.operator,
        created_at: wash.createdAt,
        previous_wash_interval: interval,
        non_standard: this.isAnomaly(wash.createdAt, washesByManausDay),
      };
    });

    const washes_history = historyAsc.reverse();

    return {
      total_washes: orderedAsc.length,
      last_wash: orderedAsc.at(-1)?.createdAt ?? null,
      last_wash_details: washes_history[0] ?? null,
      mid_range: average,
      anomaly: washes_history.some((wash) => wash.non_standard),
      washes_history,
    };
  }

  private diffMinutes(current: Date, previous: Date) {
    return Math.round((current.getTime() - previous.getTime()) / 60000);
  }

  private isAnomaly(createdAt: Date, washesByManausDay: Map<string, number>) {
    const manausParts = this.getManausDateParts(createdAt);
    const hasMoreThanOneWashInDay =
      (washesByManausDay.get(manausParts.dayKey) ?? 0) > 1;
    const isOutsideReservedHours = !RESERVED_WASH_HOURS.includes(
      manausParts.hour,
    );

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

    const value = (type: string) =>
      parts.find((part) => part.type === type)?.value ?? '';

    return {
      dayKey: `${value('year')}-${value('month')}-${value('day')}`,
      hour: Number(value('hour')),
    };
  }

  private getManausDayRange(date: Date) {
    const { dayKey } = this.getManausDateParts(date);
    const [year, month, day] = dayKey.split('-').map(Number);
    const startUtc = new Date(
      Date.UTC(year, month - 1, day, MANAUS_UTC_OFFSET_HOURS, 0, 0, 0),
    );
    const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000 - 1);

    return { startUtc, endUtc };
  }

  private paginateIfRequested<T>(items: T[], page?: number, limit?: number) {
    if (!page && !limit) return items;
    return this.paginate(items, page, limit);
  }

  private paginate<T>(items: T[], page = 1, limit = 20) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const total = items.length;
    const total_pages = Math.max(1, Math.ceil(total / safeLimit));
    const start = (safePage - 1) * safeLimit;

    return {
      items: items.slice(start, start + safeLimit),
      page: safePage,
      limit: safeLimit,
      total,
      total_pages,
    };
  }
}
