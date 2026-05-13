import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { CreatePlateWashDto } from './dto/create-plate-wash.dto';
import { CreatePlateDto } from './dto/create-plate.dto';
import { UpdatePlateDto } from './dto/update-plate.dto';
import { Plate } from './entities/plate.entity';
import { PlateWash } from './entities/plate-wash.entity';

type PlateWashHistoryItem = {
  id: string;
  operador: string;
  turno: number;
  fase: number;
  created_at: Date;
};

type PlateFilters = {
  modelo?: string;
  blank_id?: string;
  serial?: string;
  linha?: string;
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
  ) {}

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
        ...(filters?.modelo ? { plateModel: Like(`%${filters.modelo}%`) } : {}),
        ...(filters?.blank_id
          ? { blankId: Like(`%${filters.blank_id}%`) }
          : {}),
        ...(filters?.serial
          ? { serialNumber: Like(`%${filters.serial}%`) }
          : {}),
        ...(filters?.linha ? { lineName: filters.linha } : {}),
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
          turno: wash.shift,
          modelo: plate.plateModel,
          fase: wash.phase,
          linha: plate.lineName,
          serial: plate.serialNumber,
          blank_id: plate.blankId,
          operador: wash.operator,
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
      modelo: plate.plateModel,
      serial: plate.serialNumber,
      blank_id: plate.blankId,
      linha: plate.lineName,
      id_fabricante: plate.plateManufacturerId ?? null,
      pais_origem: plate.country ?? null,
      espessura:
        plate.thickness === undefined || plate.thickness === null
          ? null
          : Number(plate.thickness),
      enderecamento: plate.addressing ?? null,
      created_at: plate.createdAt,
      updated_at: plate.updatedAt,
      total_lavagens: orderedWashes.length,
      ultima_lavagem: lastWash?.createdAt ?? null,
      ultima_lavagem_detalhe: lastWash
        ? {
            id: lastWash.id,
            operador: lastWash.operator,
            turno: lastWash.shift,
            fase: lastWash.phase,
            created_at: lastWash.createdAt,
          }
        : null,
    };
  }

  private toDetail(plate: Plate) {
    return {
      ...this.toSummary(plate),
      historico_lavagens: this.sortWashesDesc(plate.washes ?? []).map(
        (wash): PlateWashHistoryItem => ({
          id: wash.id,
          operador: wash.operator,
          turno: wash.shift,
          fase: wash.phase,
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
