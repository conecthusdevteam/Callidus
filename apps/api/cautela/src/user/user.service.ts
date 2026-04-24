import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PasswordService } from '../common/security/password.service';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly passwordService: PasswordService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    if (createUserDto.papel === UserRole.ADMIN) {
      const usersCount = await this.usersRepository.count();

      if (usersCount > 0) {
        throw new ForbiddenException(
          'O perfil ADMIN só pode ser usado no bootstrap inicial da aplicação.',
        );
      }
    }

    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Já existe um usuário cadastrado com este e-mail.');
    }

    const user = this.usersRepository.create({
      ativo: createUserDto.ativo ?? true,
      email: createUserDto.email,
      nome: createUserDto.nome,
      papel: createUserDto.papel,
      senhaHash: this.passwordService.hash(createUserDto.senha),
    });

    const savedUser = await this.usersRepository.save(user);

    return this.serializeUser(savedUser);
  }

  async findAll(filters: ListUsersDto) {
    const where: FindOptionsWhere<User> = {};

    if (filters.papel) {
      where.papel = filters.papel;
    }

    if (filters.ativo !== undefined) {
      where.ativo = filters.ativo;
    }

    const users = await this.usersRepository.find({
      order: { nome: 'ASC' },
      where,
    });

    return users.map((user) => this.serializeUser(user));
  }

  async findOne(id: string) {
    const user = await this.getById(id);

    return this.serializeUser(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.getById(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Já existe um usuário cadastrado com este e-mail.');
      }
    }

    user.nome = updateUserDto.nome ?? user.nome;
    user.email = updateUserDto.email ?? user.email;
    user.papel = updateUserDto.papel ?? user.papel;
    user.ativo = updateUserDto.ativo ?? user.ativo;

    if (updateUserDto.senha) {
      user.senhaHash = this.passwordService.hash(updateUserDto.senha);
      user.refreshTokenHash = null;
      user.refreshTokenExpiresAt = null;
      user.tokenVersion += 1;
    }

    const savedUser = await this.usersRepository.save(user);

    return this.serializeUser(savedUser);
  }

  async remove(id: string) {
    const user = await this.getById(id);

    user.ativo = false;
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;
    user.tokenVersion += 1;

    const savedUser = await this.usersRepository.save(user);

    return this.serializeUser(savedUser);
  }

  async getById(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  async listGestoresAtivos() {
    const users = await this.usersRepository.find({
      order: { nome: 'ASC' },
      where: {
        ativo: true,
        papel: UserRole.GESTOR,
      },
    });

    return users.map((user) => this.serializeUser(user));
  }

  serializeUser(user: User) {
    return {
      ativo: user.ativo,
      atualizadoEm: user.atualizadoEm,
      criadoEm: user.criadoEm,
      email: user.email,
      id: user.id,
      nome: user.nome,
      papel: user.papel,
    };
  }
}
