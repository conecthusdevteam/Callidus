import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User, UserArea, UserRole } from './entities/user.entity';

const PASSWORD_SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }

  findById(id: string) {
    return this.usersRepository.findOne({ where: { id } });
  }

  save(user: User) {
    return this.usersRepository.save(user);
  }

  async updatePassword(user: User, password: string) {
    user.passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    return this.usersRepository.save(user);
  }

  async ensureBootstrapUser() {
    const email = this.configService.get<string>('AUTH_BOOTSTRAP_EMAIL');
    const password = this.configService.get<string>('AUTH_BOOTSTRAP_PASSWORD');

    if (!email || !password) return;

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.findByEmail(normalizedEmail);

    if (existing) {
      if (!existing.isActive) existing.isActive = true;
      existing.role = UserRole.ADMIN;
      existing.area = UserArea.ADMIN;
      await this.updatePassword(existing, password);
      this.logger.log(`Bootstrap admin user updated: ${normalizedEmail}`);
      return;
    }

    const user = this.usersRepository.create({
      name: this.configService.get<string>('AUTH_BOOTSTRAP_NAME') ?? 'Administrador',
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, PASSWORD_SALT_ROUNDS),
      area: UserArea.ADMIN,
      role: UserRole.ADMIN,
      isActive: true,
    });

    await this.usersRepository.save(user);
    this.logger.log(`Bootstrap admin user created: ${normalizedEmail}`);
  }
}
