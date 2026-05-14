import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plate } from '../plates/entities/plate.entity';
import { Stencil } from '../stencils/entities/stencil.entity';

@Injectable()
export class LinesService {
  constructor(
    @InjectRepository(Stencil)
    private readonly stencilRepository: Repository<Stencil>,
    @InjectRepository(Plate)
    private readonly plateRepository: Repository<Plate>,
  ) {}

  async findAll() {
    const [stencilRows, plateRows] = await Promise.all([
      this.stencilRepository
        .createQueryBuilder('stencil')
        .select('DISTINCT stencil.lineName')
        .getRawMany<{ line: string }>(),
      this.plateRepository
        .createQueryBuilder('plate')
        .select('DISTINCT plate.lineName')
        .getRawMany<{ line: string }>(),
    ]);

    return [...new Set([...stencilRows, ...plateRows].map((row) => row.line))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }
}
