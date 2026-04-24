import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cautela } from '../../cautela/entities/cautela.entity';
import { CautelaEvent } from '../../cautela/entities/cautela-event.entity';
import { Sector } from '../../sectors/entities/sector.entity';
import { UserRole } from '../../common/enums/user-role.enum';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  nome: string;

  @Column({ length: 150, unique: true })
  email: string;

  @Column({ length: 255 })
  senhaHash: string;

  @Column({
    enum: UserRole,
    type: 'simple-enum',
  })
  papel: UserRole;

  @Column({ default: true })
  ativo: boolean;

  @Column({ default: 0 })
  tokenVersion: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  refreshTokenHash: string | null;

  @Column({ type: 'datetime2', nullable: true })
  refreshTokenExpiresAt: Date | null;

  @CreateDateColumn({ type: 'datetime2' })
  criadoEm: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  atualizadoEm: Date;

  @OneToMany(() => Sector, (sector) => sector.gestor)
  setoresGerenciados: Sector[];

  @OneToMany(() => Cautela, (cautela) => cautela.solicitadoPor)
  cautelasSolicitadas: Cautela[];

  @OneToMany(() => Cautela, (cautela) => cautela.gestor)
  cautelasParaAnalise: Cautela[];

  @OneToMany(() => CautelaEvent, (event) => event.feitoPor)
  eventos: CautelaEvent[];
}
