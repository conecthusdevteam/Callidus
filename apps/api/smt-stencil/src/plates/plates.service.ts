import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { CreatePlateWashDto } from './dto/create-plate-wash.dto';
import { CreatePlateDto } from './dto/create-plate.dto';
import { UpdatePlateDto } from './dto/update-plate.dto';
import { PlateWash } from './entities/plate-wash.entity';
import { Plate } from './entities/plate.entity';

const MANAUS_TIME_ZONE = 'America/Manaus';
const MANAUS_UTC_OFFSET_HOURS = 4;

type PlateWashHistoryItem = {
  id: string;
  operator: string;
  shift: number;
  phase: number;
  created_at: Date;
};

type PlateFilters = {
  plate_model?: string;
  blank_id?: string;
  serial?: string;
  line?: string;
  page?: number;
  limit?: number;
};

type RecentPlateWashFilters = {
  page?: number;
  limit?: number;
};

@Injectable()
export class PlatesService {
  constructor(
    @InjectRepository(Plate)
    private readonly repository: Repository<Plate>,
    @InjectRepository(PlateWash)
    private readonly washRepository: Repository<PlateWash>,
  ) { }

  async create(dto: CreatePlateDto) {
    const existingPlate = await this.findByPlateModel(dto.plateModel);
    if (existingPlate) {
      throw new ConflictException('Plate already registered');
    }

    const plate = this.repository.create(dto);

    return this.repository.save(plate);
  }

  async findAll(filters?: PlateFilters) {
    const plates = await this.repository.find({
      where: {
        ...(filters?.plate_model ? { plateModel: Like(`%${filters.plate_model}%`) } : {}),
        ...(filters?.blank_id
          ? { blankId: Like(`%${filters.blank_id}%`) }
          : {}),
        ...(filters?.serial
          ? { serialNumber: Like(`%${filters.serial}%`) }
          : {}),
        ...(filters?.line ? { lineName: filters.line } : {}),
      },
      relations: {
        washes: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    const items = plates.map((plate) => this.toSummary(plate));

    return this.paginateIfRequested(items, filters?.page, filters?.limit);
  }

  async findTodayPlateWashes(filters?: PlateFilters) {
    const { startUtc, endUtc } = this.getManausDayRange(new Date());

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.washRepository
      .createQueryBuilder('wash')
      .leftJoinAndSelect('wash.plate', 'plate')
      .where('wash.createdAt BETWEEN :startOfDay AND :endOfDay', {
        startOfDay: startUtc,
        endOfDay: endUtc,
      });

    if (filters?.plate_model) {
      queryBuilder.andWhere('plate.plateModel LIKE :plateModel', {
        plateModel: `%${filters.plate_model}%`,
      });
    }

    if (filters?.blank_id) {
      queryBuilder.andWhere('plate.blankId LIKE :blankId', {
        blankId: `%${filters.blank_id}%`,
      });
    }

    if (filters?.serial) {
      queryBuilder.andWhere('plate.serialNumber LIKE :serialNumber', {
        serialNumber: `%${filters.serial}%`,
      });
    }

    if (filters?.line) {
      queryBuilder.andWhere('plate.lineName = :lineName', {
        lineName: filters.line,
      });
    }

    queryBuilder.orderBy('wash.createdAt', 'DESC');

    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const plate = await this.repository.findOne({
      where: { id },
      relations: {
        washes: true,
      },
    });

    if (!plate) return null;

    return this.toDetail(plate);
  }

  async createWash(id: string, dto: CreatePlateWashDto) {
    const plate = await this.repository.findOneBy({ id });
    if (!plate) return null;

    const wash = this.washRepository.create({
      plateId: plate.id,
      operator: dto.operator,
      shift: dto.shift,
      phase: dto.phase,
    });

    return this.washRepository.save(wash);
  }

  async findRecentWashes(filters?: RecentPlateWashFilters) {
    const plates = await this.repository.find({
      relations: {
        washes: true,
      },
    });

    const items = plates
      .flatMap((plate) =>
        this.sortWashesDesc(plate.washes ?? []).map((wash) => ({
          id: wash.id,
          plate_id: plate.id,
          created_at: wash.createdAt,
          shift: wash.shift,
          plate_model: plate.plateModel,
          phase: wash.phase,
          line: plate.lineName,
          serial: plate.serialNumber,
          blank_id: plate.blankId,
          operator: wash.operator,
        })),
      )
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    return this.paginate(items, filters?.page, filters?.limit);
  }

  findByPlateModel(plateModel: string): Promise<Plate | null> {
    return this.repository.findOne({ where: { plateModel } });
  }

  async update(id: string, dto: UpdatePlateDto) {
    const plate = await this.repository.findOneBy({ id });
    if (!plate) return null;
    this.repository.merge(plate, dto);
    return this.repository.save(plate);
  }

  async remove(id: string) {
    const plate = await this.repository.findOneBy({ id });
    if (!plate) return null;
    return this.repository.remove(plate);
  }

  private toSummary(plate: Plate) {
    const orderedWashes = this.sortWashesDesc(plate.washes ?? []);
    const lastWash = orderedWashes[0] ?? null;

    return {
      id: plate.id,
      plate_model: plate.plateModel,
      serial: plate.serialNumber,
      blank_id: plate.blankId,
      line: plate.lineName,
      manufacturer_id: plate.plateManufacturerId ?? null,
      origin_country: plate.country ?? null,
      thickness:
        plate.thickness === undefined || plate.thickness === null
          ? null
          : Number(plate.thickness),
      addressing: plate.addressing ?? null,
      created_at: plate.createdAt,
      updated_at: plate.updatedAt,
      total_washes: orderedWashes.length,
      last_wash: lastWash?.createdAt ?? null,
      last_wash_details: lastWash
        ? {
          id: lastWash.id,
          operator: lastWash.operator,
          shift: lastWash.shift,
          phase: lastWash.phase,
          created_at: lastWash.createdAt,
        }
        : null,
    };
  }

  private toDetail(plate: Plate) {
    return {
      ...this.toSummary(plate),
      washes_history: this.sortWashesDesc(plate.washes ?? []).map(
        (wash): PlateWashHistoryItem => ({
          id: wash.id,
          operator: wash.operator,
          shift: wash.shift,
          phase: wash.phase,
          created_at: wash.createdAt,
        }),
      ),
    };
  }

  private sortWashesDesc(washes: PlateWash[]) {
    return [...washes].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  private getManausDayRange(date: Date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: MANAUS_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const value = (type: string) =>
      parts.find((part) => part.type === type)?.value ?? '';
    const year = Number(value('year'));
    const month = Number(value('month'));
    const day = Number(value('day'));
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
