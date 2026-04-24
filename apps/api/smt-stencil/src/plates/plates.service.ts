import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePlateDto } from './dto/create-plate.dto';
import { UpdatePlateDto } from './dto/update-plate.dto';
import { Plate } from './entities/plate.entity';

@Injectable()
export class PlatesService {
  constructor(
    @InjectRepository(Plate)
    private readonly repository: Repository<Plate>
  ) { }

  async create(dto: CreatePlateDto) {
    const existingPlate = await this.findByPlateModel(dto.plateModel);
    if (existingPlate) {
      throw new ConflictException('Plate already registered');
    }

    const plate = this.repository.create(dto);

    return this.repository.save(plate);
  }

  findAll() {
    return this.repository.find();
  }

  findOne(id: string) {
    return this.repository.findOneBy({ id });
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
}
