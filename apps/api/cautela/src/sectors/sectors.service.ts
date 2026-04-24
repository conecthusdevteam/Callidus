import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateSectorDto } from './dto/create-sector.dto';
import { ListSectorsDto } from './dto/list-sectors.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';
import { Sector } from './entities/sector.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class SectorsService {
  constructor(
    @InjectRepository(Sector)
    private readonly sectorsRepository: Repository<Sector>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createSectorDto: CreateSectorDto) {
    await this.ensureNumeroSetorIsAvailable(createSectorDto.numeroSetor);

    const gestor = await this.validateGestor(createSectorDto.gestorId);
    const sector = this.sectorsRepository.create({
      ativo: createSectorDto.ativo ?? true,
      gestorId: gestor.id,
      nome: createSectorDto.nome,
      numeroSetor: createSectorDto.numeroSetor,
    });

    const savedSector = await this.sectorsRepository.save(sector);

    return this.findOne(savedSector.id);
  }

  async findAll(filters: ListSectorsDto) {
    const where: FindOptionsWhere<Sector> = {};

    if (filters.ativo !== undefined) {
      where.ativo = filters.ativo;
    }

    const sectors = await this.sectorsRepository.find({
      order: { numeroSetor: 'ASC' },
      relations: { gestor: true },
      where,
    });

    return sectors.map((sector) => this.serializeSector(sector));
  }

  async findOne(id: string) {
    const sector = await this.sectorsRepository.findOne({
      relations: { gestor: true },
      where: { id },
    });

    if (!sector) {
      throw new NotFoundException('Setor não encontrado.');
    }

    return this.serializeSector(sector);
  }

  async update(id: string, updateSectorDto: UpdateSectorDto) {
    const sector = await this.sectorsRepository.findOne({
      where: { id },
    });

    if (!sector) {
      throw new NotFoundException('Setor não encontrado.');
    }

    if (
      updateSectorDto.numeroSetor !== undefined &&
      updateSectorDto.numeroSetor !== sector.numeroSetor
    ) {
      await this.ensureNumeroSetorIsAvailable(updateSectorDto.numeroSetor, id);
      sector.numeroSetor = updateSectorDto.numeroSetor;
    }

    if (updateSectorDto.gestorId && updateSectorDto.gestorId !== sector.gestorId) {
      const gestor = await this.validateGestor(updateSectorDto.gestorId);
      sector.gestorId = gestor.id;
    }

    sector.nome = updateSectorDto.nome ?? sector.nome;
    sector.ativo = updateSectorDto.ativo ?? sector.ativo;

    await this.sectorsRepository.save(sector);

    return this.findOne(id);
  }

  async remove(id: string) {
    const sector = await this.sectorsRepository.findOne({
      where: { id },
    });

    if (!sector) {
      throw new NotFoundException('Setor não encontrado.');
    }

    sector.ativo = false;
    await this.sectorsRepository.save(sector);

    return this.findOne(id);
  }

  private async ensureNumeroSetorIsAvailable(numeroSetor: number, sectorId?: string) {
    const existingSector = await this.sectorsRepository.findOne({
      where: { numeroSetor },
    });

    if (existingSector && existingSector.id !== sectorId) {
      throw new ConflictException('Já existe um setor cadastrado com esse número.');
    }
  }

  private async validateGestor(gestorId: string) {
    const gestor = await this.usersRepository.findOne({
      where: { id: gestorId },
    });

    if (!gestor || !gestor.ativo) {
      throw new BadRequestException('Gestor informado não foi encontrado ou está inativo.');
    }

    if (gestor.papel !== UserRole.GESTOR) {
      throw new BadRequestException('O usuário informado precisa ter perfil de GESTOR.');
    }

    return gestor;
  }

  private serializeSector(sector: Sector) {
    return {
      ativo: sector.ativo,
      atualizadoEm: sector.atualizadoEm,
      criadoEm: sector.criadoEm,
      gestor: sector.gestor
        ? {
            ativo: sector.gestor.ativo,
            email: sector.gestor.email,
            id: sector.gestor.id,
            nome: sector.gestor.nome,
            papel: sector.gestor.papel,
          }
        : null,
      gestorId: sector.gestorId,
      id: sector.id,
      nome: sector.nome,
      numeroSetor: sector.numeroSetor,
    };
  }
}
