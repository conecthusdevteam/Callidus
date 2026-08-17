import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  LessThan,
  Like,
  Repository,
} from 'typeorm';
import { CreateStencilWashDto } from './dto/create-stencil-wash.dto';
import { CreateStencilDto } from './dto/create-stencil.dto';
import { UpdateStencilDto } from './dto/update-stencil.dto';
import { StencilWash } from './entities/stencil-wash.entity';
import {
  Stencil,
  StencilApprovalStatus,
  StencilTechnicalOpinion,
  WashStatus,
} from './entities/stencil.entity';

const MANAUS_TIME_ZONE = 'America/Manaus';
const MANAUS_UTC_OFFSET_HOURS = 4;
const RESERVED_WASH_HOURS = [11, 16];
const DEFAULT_ANALYTICS_DAYS = 30;
const ALLOWED_ANALYTICS_DAYS = [7, 15, 30, 60, 90] as const;

type WashCategory = 'planned' | 'anomalous' | 'multiple';

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

type StencilWashAnalyticsPoint = {
  id: string;
  operator: string;
  created_at: Date;
  date_key: string;
  day_label: string;
  day_index: number;
  time_label: string;
  hour_decimal: number;
  category: WashCategory;
};

type StencilWashIntervalBar = {
  date_key: string;
  day_label: string;
  day_index: number;
  interval_minutes: number | null;
  category: WashCategory;
  wash_ids: string[];
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
  stencilCode?: string;
  addressing?: string;
  manufactureId?: string;
  country?: string;
  operator?: string;
  occurrence?: WashCategory;
  status?: string;
  lineName?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'asc' | 'desc';
};

type StencilPayload = Partial<CreateStencilDto | UpdateStencilDto>;

const DEFAULT_STENCIL_LINE = 'Sem linha definida';
const CHINA_COUNTRY = 'china';

@Injectable()
export class StencilsService {
  constructor(
    @InjectRepository(Stencil)
    private readonly repository: Repository<Stencil>,
    @InjectRepository(StencilWash)
    private readonly washRepository: Repository<StencilWash>,
  ) {}

  async create(dto: CreateStencilDto) {
    const payload = this.normalizeStencilPayload(dto, 'create');
    const existingStencil = await this.findByStencilCode(payload.stencilCode);
    if (existingStencil) {
      throw new ConflictException('Stencil already registered');
    }

    const stencil = this.repository.create(payload);

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
        ...(filters?.country ? { country: Like(`%${filters.country}%`) } : {}),
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

  async findWashAnalytics(id: string, days = DEFAULT_ANALYTICS_DAYS) {
    const periodDays = this.normalizeAnalyticsDays(days);
    const { startUtc, endUtc } = this.getManausAnalyticsRange(
      new Date(),
      periodDays,
    );
    const stencil = await this.repository.findOne({
      where: { id },
    });
    if (!stencil) return null;

    const [periodWashes, previousWashes] = await Promise.all([
      this.washRepository.find({
        where: {
          stencilId: id,
          createdAt: Between(startUtc, endUtc),
        },
        order: { createdAt: 'ASC' },
      }),
      this.washRepository.find({
        where: {
          stencilId: id,
          createdAt: LessThan(startUtc),
        },
        order: { createdAt: 'DESC' },
        take: 1,
      }),
    ]);

    const previousWash = previousWashes[0] ?? null;
    const washesByDay = this.groupWashesByManausDay(periodWashes);
    const categoriesByWashId = this.getWashCategories(
      periodWashes,
      washesByDay,
    );
    const timePoints = periodWashes.map((wash) =>
      this.toAnalyticsPoint(
        wash,
        startUtc,
        categoriesByWashId.get(wash.id) ?? 'anomalous',
      ),
    );
    const intervalBars = this.getIntervalBars(
      periodWashes,
      previousWash,
      startUtc,
      washesByDay,
      categoriesByWashId,
    );

    return {
      stencil: this.toSummary({ ...stencil, washes: periodWashes } as Stencil),
      period: {
        days: periodDays,
        start: startUtc,
        end: endUtc,
      },
      counts: {
        planned: timePoints.filter((point) => point.category === 'planned')
          .length,
        anomalous: timePoints.filter((point) => point.category === 'anomalous')
          .length,
        multiple: timePoints.filter((point) => point.category === 'multiple')
          .length,
        total: timePoints.length,
      },
      time_points: timePoints,
      interval_bars: intervalBars,
      interval_summary: this.getIntervalSummary(intervalBars),
    };
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
    if (stencil.status !== WashStatus.ACTIVE) {
      throw new ConflictException(
        'Only active stencils can receive new washes',
      );
    }

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
    const page = Math.max(1, Number(filters?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters?.limit) || 20));
    const localWashDate = 'CAST(DATEADD(HOUR, -4, wash.createdAt) AS date)';
    const sameDayWashCount = `(SELECT COUNT(1)
      FROM stencil_washes dayWash
      WHERE dayWash.stencilId = wash.stencilId
        AND CAST(DATEADD(HOUR, -4, dayWash.createdAt) AS date) = ${localWashDate})`;
    const occurrenceExpression = `CASE
      WHEN ${sameDayWashCount} > 1 THEN 'multiple'
      WHEN DATEPART(HOUR, DATEADD(HOUR, -4, wash.createdAt)) IN (11, 16) THEN 'planned'
      ELSE 'anomalous'
    END`;
    const previousWashExpression = `(SELECT MAX(previousWash.createdAt)
      FROM stencil_washes previousWash
      WHERE previousWash.stencilId = wash.stencilId
        AND previousWash.createdAt < wash.createdAt)`;

    const query = this.washRepository
      .createQueryBuilder('wash')
      .innerJoin('wash.stencil', 'stencil');

    if (filters?.stencilCode) {
      query.andWhere('stencil.stencilCode LIKE :stencilCode', {
        stencilCode: `%${filters.stencilCode}%`,
      });
    }
    if (filters?.addressing) {
      query.andWhere('stencil.addressing LIKE :addressing', {
        addressing: `%${filters.addressing}%`,
      });
    }
    if (filters?.manufactureId) {
      query.andWhere('stencil.manufactureId LIKE :manufactureId', {
        manufactureId: `%${filters.manufactureId}%`,
      });
    }
    if (filters?.country) {
      query.andWhere('stencil.country LIKE :country', {
        country: `%${filters.country}%`,
      });
    }
    if (filters?.operator) {
      query.andWhere('wash.operator LIKE :operator', {
        operator: `%${filters.operator}%`,
      });
    }
    if (filters?.status) {
      query.andWhere('stencil.status = :status', { status: filters.status });
    }
    if (filters?.lineName) {
      query.andWhere('stencil.lineName = :lineName', {
        lineName: filters.lineName,
      });
    }
    if (filters?.dateFrom) {
      query.andWhere('wash.createdAt >= :dateFrom', {
        dateFrom: new Date(this.getDateFilterBoundary(filters.dateFrom, false)),
      });
    }
    if (filters?.dateTo) {
      query.andWhere('wash.createdAt <= :dateTo', {
        dateTo: new Date(this.getDateFilterBoundary(filters.dateTo, true)),
      });
    }
    if (filters?.occurrence) {
      query.andWhere(`${occurrenceExpression} = :occurrence`, {
        occurrence: filters.occurrence,
      });
    } else if (filters?.attentionOnly) {
      query.andWhere(`${occurrenceExpression} <> 'planned'`);
    }

    const total = await query.clone().getCount();
    const rows = await query
      .select('wash.id', 'id')
      .addSelect('wash.stencilId', 'stencil_id')
      .addSelect('wash.createdAt', 'created_at')
      .addSelect('wash.operator', 'operator')
      .addSelect('stencil.stencilCode', 'stencil_code')
      .addSelect('stencil.addressing', 'addressing')
      .addSelect('stencil.manufactureId', 'manufacture_id')
      .addSelect('stencil.country', 'country')
      .addSelect('stencil.status', 'status')
      .addSelect('stencil.lineName', 'line_name')
      .addSelect(occurrenceExpression, 'occurrence')
      .addSelect(
        `DATEDIFF(MINUTE, ${previousWashExpression}, wash.createdAt)`,
        'previous_wash_interval',
      )
      .orderBy('wash.createdAt', filters?.sort === 'asc' ? 'ASC' : 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<Record<string, string | number | Date | null>>();

    return {
      items: rows.map((row) => ({
        ...row,
        addressing: String(row.addressing).padStart(3, '0'),
        non_standard: row.occurrence !== 'planned',
      })),
      page,
      limit,
      total,
      total_pages: Math.max(1, Math.ceil(total / limit)),
    };
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

    const payload = this.normalizeStencilPayload(dto, 'update', stencil);
    if (payload.stencilCode && payload.stencilCode !== stencil.stencilCode) {
      const existingStencil = await this.findByStencilCode(payload.stencilCode);
      if (existingStencil && existingStencil.id !== id) {
        throw new ConflictException('Stencil already registered');
      }
    }

    this.repository.merge(stencil, payload);
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
      plate_model: stencil.plateModel ?? null,
      plate_type: stencil.plateType ?? null,
      version: stencil.version ?? null,
      phase: stencil.phase ?? null,
      copy: stencil.copy ?? null,
      manufacture_id: stencil.manufactureId,
      country: stencil.country,
      thickness: Number(stencil.thickness),
      eddressing: stencil.addressing,
      manufactured_at: stencil.manufacturedAt ?? null,
      serigraphy: stencil.serigraphy,
      fiducials: stencil.fiducials,
      finishing: stencil.finishing,
      technical_opinion: stencil.technicalOpinion,
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

  private normalizeStencilPayload(
    dto: StencilPayload,
    mode: 'create' | 'update',
    current?: Stencil,
  ): Partial<Stencil> & { stencilCode: string } {
    const next = {
      stencilCode: this.cleanOptionalText(dto.stencilCode) ?? current?.stencilCode,
      plateModel: this.cleanOptionalText(dto.plateModel) ?? current?.plateModel,
      plateType: this.cleanOptionalText(dto.plateType) ?? current?.plateType,
      version:
        dto.version === null
          ? undefined
          : this.cleanOptionalText(dto.version) ?? current?.version,
      phase: dto.phase ?? current?.phase,
      copy:
        dto.copy === null
          ? undefined
          : this.cleanOptionalText(dto.copy) ?? current?.copy,
      manufactureId:
        this.cleanOptionalText(dto.manufactureId) ?? current?.manufactureId,
      country: this.cleanOptionalText(dto.country) ?? current?.country,
      thickness: dto.thickness ?? current?.thickness,
      addressing: this.cleanOptionalText(dto.addressing) ?? current?.addressing,
      manufacturedAt: dto.manufacturedAt
        ? new Date(dto.manufacturedAt)
        : current?.manufacturedAt,
      lineName:
        this.cleanOptionalText(dto.lineName) ??
        current?.lineName ??
        DEFAULT_STENCIL_LINE,
      status:
        dto.status ??
        current?.status ??
        (mode === 'create' ? WashStatus.VALIDATION : undefined),
      serigraphy:
        dto.serigraphy ??
        current?.serigraphy ??
        StencilApprovalStatus.OK,
      fiducials:
        dto.fiducials ??
        current?.fiducials ??
        StencilApprovalStatus.OK,
      finishing:
        dto.finishing ??
        current?.finishing ??
        StencilApprovalStatus.OK,
      technicalOpinion:
        dto.technicalOpinion ??
        current?.technicalOpinion ??
        StencilTechnicalOpinion.APPROVED,
    };

    const usesStructuredFields = this.hasStructuredStencilFields(dto, current);

    if (next.country && this.isChina(next.country)) {
      next.manufactureId = 'CHINA';
    }

    if (usesStructuredFields) {
      this.assertStructuredStencil(next);
      next.stencilCode = this.generateStencilCode(next);
    }

    if (!next.stencilCode) {
      throw new BadRequestException(
        'stencilCode or structured stencil identification fields are required',
      );
    }

    if (!next.manufactureId) {
      throw new BadRequestException('manufactureId is required');
    }

    return next as Partial<Stencil> & { stencilCode: string };
  }

  private hasStructuredStencilFields(dto: StencilPayload, current?: Stencil) {
    return Boolean(
      dto.plateModel !== undefined ||
        dto.plateType !== undefined ||
        dto.version !== undefined ||
        dto.phase !== undefined ||
        dto.copy !== undefined ||
        current?.plateModel ||
        current?.plateType ||
        current?.phase,
    );
  }

  private assertStructuredStencil(stencil: Partial<Stencil>) {
    const missing: string[] = [];

    if (!stencil.plateModel) missing.push('plateModel');
    if (!stencil.plateType) missing.push('plateType');
    if (!stencil.phase) missing.push('phase');
    if (!stencil.country) missing.push('country');
    if (!stencil.manufactureId) missing.push('manufactureId');
    if (stencil.thickness === undefined || stencil.thickness === null) {
      missing.push('thickness');
    }
    if (!stencil.manufacturedAt) missing.push('manufacturedAt');
    if (!stencil.addressing) missing.push('addressing');
    if (!stencil.serigraphy) missing.push('serigraphy');
    if (!stencil.fiducials) missing.push('fiducials');
    if (!stencil.finishing) missing.push('finishing');
    if (!stencil.technicalOpinion) missing.push('technicalOpinion');

    if (missing.length > 0) {
      throw new BadRequestException(
        `Missing required structured stencil fields: ${missing.join(', ')}`,
      );
    }
  }

  private generateStencilCode(stencil: Partial<Stencil>) {
    const segments = [
      this.formatCodeSegment(stencil.plateModel),
      this.formatCodeSegment(stencil.plateType),
      stencil.version ? `V${this.formatCodeSegment(stencil.version)}` : null,
      this.formatCodeSegment(stencil.phase),
      this.isChina(stencil.country)
        ? 'CHINA'
        : this.formatCodeSegment(stencil.manufactureId),
    ].filter((segment): segment is string => Boolean(segment));

    const code = segments.join('_');
    const copy = this.formatCodeSegment(stencil.copy);

    return copy ? `${code}/${copy}` : code;
  }

  private formatCodeSegment(value?: string | null) {
    const segment = this.cleanOptionalText(value);
    if (!segment) return null;
    return segment.toUpperCase().replace(/\s+/g, '');
  }

  private cleanOptionalText(value?: string | null) {
    if (value === undefined || value === null) return undefined;
    const trimmed = String(value).trim();
    return trimmed || undefined;
  }

  private isChina(country?: string | null) {
    return this.cleanOptionalText(country)?.toLowerCase() === CHINA_COUNTRY;
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

  private getWashCategories(
    washes: StencilWash[],
    washesByDay: Map<string, StencilWash[]>,
  ) {
    return washes.reduce((acc, wash) => {
      const manausParts = this.getManausDateParts(wash.createdAt);
      const hasMultiple =
        (washesByDay.get(manausParts.dayKey)?.length ?? 0) > 1;
      const isPlanned = RESERVED_WASH_HOURS.includes(manausParts.hour);
      acc.set(
        wash.id,
        hasMultiple ? 'multiple' : isPlanned ? 'planned' : 'anomalous',
      );
      return acc;
    }, new Map<string, WashCategory>());
  }

  private toAnalyticsPoint(
    wash: StencilWash,
    startUtc: Date,
    category: WashCategory,
  ): StencilWashAnalyticsPoint {
    const manausParts = this.getManausDateParts(wash.createdAt);

    return {
      id: wash.id,
      operator: wash.operator,
      created_at: wash.createdAt,
      date_key: manausParts.dayKey,
      day_label: manausParts.dayLabel,
      day_index: this.diffDaysFromRangeStart(manausParts.dayKey, startUtc),
      time_label: manausParts.timeLabel,
      hour_decimal: manausParts.hour + manausParts.minute / 60,
      category,
    };
  }

  private getIntervalBars(
    periodWashes: StencilWash[],
    previousWash: StencilWash | null,
    startUtc: Date,
    washesByDay: Map<string, StencilWash[]>,
    categoriesByWashId: Map<string, WashCategory>,
  ): StencilWashIntervalBar[] {
    const orderedPeriodWashes = [...periodWashes].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    const previousByWashId = new Map<string, StencilWash>();

    orderedPeriodWashes.forEach((wash, index) => {
      const previous =
        index === 0 ? previousWash : orderedPeriodWashes[index - 1];
      if (previous) previousByWashId.set(wash.id, previous);
    });

    return [...washesByDay.entries()]
      .map(([dateKey, washes]) => {
        const ordered = [...washes].sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        );
        const category =
          categoriesByWashId.get(ordered[0]?.id ?? '') ?? 'anomalous';
        const dayParts = this.getManausDateParts(ordered[0].createdAt);

        if (ordered.length > 1) {
          const intervals = ordered
            .slice(1)
            .map((wash, index) =>
              this.diffMinutes(wash.createdAt, ordered[index].createdAt),
            );

          return {
            date_key: dateKey,
            day_label: dayParts.dayLabel,
            day_index: this.diffDaysFromRangeStart(dateKey, startUtc),
            interval_minutes: Math.min(...intervals),
            category,
            wash_ids: ordered.map((wash) => wash.id),
          };
        }

        const previous = previousByWashId.get(ordered[0].id);

        return {
          date_key: dateKey,
          day_label: dayParts.dayLabel,
          day_index: this.diffDaysFromRangeStart(dateKey, startUtc),
          interval_minutes: previous
            ? this.diffMinutes(ordered[0].createdAt, previous.createdAt)
            : null,
          category,
          wash_ids: [ordered[0].id],
        };
      })
      .sort((a, b) => a.day_index - b.day_index);
  }

  private getIntervalSummary(intervalBars: StencilWashIntervalBar[]) {
    const barsWithInterval = intervalBars.filter(
      (bar): bar is StencilWashIntervalBar & { interval_minutes: number } =>
        bar.interval_minutes !== null,
    );

    const shortest = barsWithInterval.reduce<
      (StencilWashIntervalBar & { interval_minutes: number }) | null
    >(
      (current, bar) =>
        !current || bar.interval_minutes < current.interval_minutes
          ? bar
          : current,
      null,
    );
    const longest = barsWithInterval.reduce<
      (StencilWashIntervalBar & { interval_minutes: number }) | null
    >(
      (current, bar) =>
        !current || bar.interval_minutes > current.interval_minutes
          ? bar
          : current,
      null,
    );

    return {
      average_interval_minutes:
        barsWithInterval.length > 0
          ? Math.round(
              barsWithInterval.reduce(
                (total, bar) => total + bar.interval_minutes,
                0,
              ) / barsWithInterval.length,
            )
          : null,
      shortest_interval_minutes: shortest?.interval_minutes ?? null,
      shortest_interval_date: shortest?.day_label ?? null,
      longest_interval_minutes: longest?.interval_minutes ?? null,
      longest_interval_date: longest?.day_label ?? null,
    };
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

  private groupWashesByManausDay(washes: StencilWash[]) {
    return washes.reduce((acc, wash) => {
      const { dayKey } = this.getManausDateParts(wash.createdAt);
      acc.set(dayKey, [...(acc.get(dayKey) ?? []), wash]);
      return acc;
    }, new Map<string, StencilWash[]>());
  }

  private getManausDateParts(date: Date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: MANAUS_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const value = (type: string) =>
      parts.find((part) => part.type === type)?.value ?? '';

    return {
      dayKey: `${value('year')}-${value('month')}-${value('day')}`,
      dayLabel: `${value('day')}/${value('month')}`,
      hour: Number(value('hour')),
      minute: Number(value('minute')),
      timeLabel: `${value('hour')}:${value('minute')}`,
    };
  }

  private diffDaysFromRangeStart(dayKey: string, startUtc: Date) {
    const [year, month, day] = dayKey.split('-').map(Number);
    const currentStartUtc = new Date(
      Date.UTC(year, month - 1, day, MANAUS_UTC_OFFSET_HOURS, 0, 0, 0),
    );

    return Math.round(
      (currentStartUtc.getTime() - startUtc.getTime()) / (24 * 60 * 60 * 1000),
    );
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

  private normalizeAnalyticsDays(days: number) {
    return ALLOWED_ANALYTICS_DAYS.includes(
      days as (typeof ALLOWED_ANALYTICS_DAYS)[number],
    )
      ? days
      : DEFAULT_ANALYTICS_DAYS;
  }

  private getManausAnalyticsRange(date: Date, days: number) {
    const { startUtc: todayStartUtc } = this.getManausDayRange(date);
    const startUtc = new Date(
      todayStartUtc.getTime() - (days - 1) * 24 * 60 * 60 * 1000,
    );
    const endUtc = new Date(todayStartUtc.getTime() + 24 * 60 * 60 * 1000 - 1);

    return { startUtc, endUtc };
  }

  private getDateFilterBoundary(date: string, endOfDay: boolean) {
    const reference = new Date(`${date}T12:00:00-04:00`);
    const range = this.getManausDayRange(reference);
    return (endOfDay ? range.endUtc : range.startUtc).getTime();
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
