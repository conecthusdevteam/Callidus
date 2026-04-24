import { ConflictException, Injectable } from '@nestjs/common';
import { CreateStencilDto } from './dto/create-stencil.dto';
import { UpdateStencilDto } from './dto/update-stencil.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Stencil } from './entities/stencil.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StencilsService {
  constructor(
    @InjectRepository(Stencil)
    private readonly repository: Repository<Stencil>
  ) { }
  
  async create(dto: CreateStencilDto) {
    const existingStencil = await this.findByStencilCode(dto.stencilCode);
    if (existingStencil) {
      throw new ConflictException('Stencil already registered');
    }

    const stencil = this.repository.create(dto);

    return this.repository.save(stencil);
  }

  findAll() {
    return this.repository.find();
  }

  findOne(id: string) {
    return this.repository.findOneBy({ id });
  }

  findByStencilCode(stencilCode: string): Promise<Stencil | null> {
    return this.repository.findOne({ where: { stencilCode } })
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
}
