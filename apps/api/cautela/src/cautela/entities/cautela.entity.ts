import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CautelaStatus } from '../../common/enums/cautela-status.enum';
import { CautelaType } from '../../common/enums/cautela-type.enum';
import { Sector } from '../../sectors/entities/sector.entity';
import { User } from '../../user/entities/user.entity';
import { CautelaEvent } from './cautela-event.entity';
import { CautelaItem } from './cautela-item.entity';

@Entity({ name: 'cautelas' })
export class Cautela {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    enum: CautelaType,
    type: 'simple-enum',
  })
  tipo: CautelaType;

  @Column({
    enum: CautelaStatus,
    type: 'simple-enum',
  })
  status: CautelaStatus;

  @Column()
  solicitadoPorId: string;

  @Column()
  gestorId: string;

  @Column()
  setorId: string;

  @Column({ length: 150 })
  proprietarioNome: string;

  @Column({ length: 150 })
  proprietarioEmail: string;

  @Column()
  retornoItem: boolean;

  @Column({ type: 'datetime2', nullable: true })
  validade: Date | null;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  justificativaRejeicao: string | null;

  @Column({ type: 'datetime2', nullable: true })
  respondidoEm: Date | null;

  @CreateDateColumn({ type: 'datetime2' })
  criadoEm: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  atualizadoEm: Date;

  @ManyToOne(() => User, (user) => user.cautelasSolicitadas, { eager: false })
  @JoinColumn({ name: 'solicitadoPorId' })
  solicitadoPor: User;

  @ManyToOne(() => User, (user) => user.cautelasParaAnalise, { eager: false })
  @JoinColumn({ name: 'gestorId' })
  gestor: User;

  @ManyToOne(() => Sector, (sector) => sector.cautelas, { eager: false })
  @JoinColumn({ name: 'setorId' })
  setor: Sector;

  @OneToMany(() => CautelaItem, (item) => item.cautela, {
    cascade: true,
  })
  itens: CautelaItem[];

  @OneToMany(() => CautelaEvent, (event) => event.cautela, {
    cascade: true,
  })
  eventos: CautelaEvent[];
}
