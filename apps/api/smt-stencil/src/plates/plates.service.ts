import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

@Injectable()
export class PlatesService {
  constructor(
    @InjectRepository(Plate)
    private readonly repository: Repository<Plate>,
    @InjectRepository(PlateWash)
    private readonly washRepository: Repository<PlateWash>
  ) { }

  async create(dto: CreatePlateDto) {
    const existingPlate = await this.findByPlateModel(dto.plateModel);
    if (existingPlate) {
      throw new ConflictException('Plate already registered');
    }

    const plate = this.repository.create(dto);

    return this.repository.save(plate);
  }

  async findAll(filters?: { linha?: string }) {
    const plates = await this.repository.find({
      where: {
        ...(filters?.linha ? { lineName: filters.linha } : {}),
      },
      relations: {
        washes: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return plates.map((plate) => this.toSummary(plate));
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
      espessura: plate.thickness === undefined || plate.thickness === null ? null : Number(plate.thickness),
      enderecamento: plate.addressing ?? null,
      created_at: plate.createdAt,
      updated_at: plate.updatedAt,
      total_lavagens: orderedWashes.length,
      ultima_lavagem: lastWash?.createdAt ?? null,
    };
  }

  private toDetail(plate: Plate) {
    return {
      ...this.toSummary(plate),
      historico_lavagens: this.sortWashesDesc(plate.washes ?? []).map((wash): PlateWashHistoryItem => ({
        id: wash.id,
        operador: wash.operator,
        turno: wash.shift,
        fase: wash.phase,
        created_at: wash.createdAt,
      })),
    };
  }

  private sortWashesDesc(washes: PlateWash[]) {
    return [...washes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
