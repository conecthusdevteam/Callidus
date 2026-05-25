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
import { CautelaFlowStep } from '../../common/enums/cautela-flow-step.enum';
import { CautelaPermissionType } from '../../common/enums/cautela-permission-type.enum';
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
    default: CautelaPermissionType.ENTRADA_UNICA,
    enum: CautelaPermissionType,
    type: 'simple-enum',
  })
  tipoPermissao: CautelaPermissionType;

  @Column({
    enum: CautelaStatus,
    type: 'simple-enum',
  })
  status: CautelaStatus;

  @Column({
    default: CautelaFlowStep.SOLICITADA,
    enum: CautelaFlowStep,
    type: 'simple-enum',
  })
  etapaFluxo: CautelaFlowStep;

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

  @Column({ type: 'nvarchar', length: 150, nullable: true })
  empresa: string | null;

  @Column({ type: 'nvarchar', length: 30, nullable: true })
  documentoProprietario: string | null;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  justificativaRejeicao: string | null;

  @Column({ type: 'datetime2', nullable: true })
  respondidoEm: Date | null;

  @Column({ type: 'datetime2', nullable: true })
  aprovadoEm: Date | null;

  @Column({ type: 'datetime2', nullable: true })
  rejeitadoEm: Date | null;

  @Column({ type: 'datetime2', nullable: true })
  saidaAutorizadaEm: Date | null;

  @Column({ type: 'uniqueidentifier', nullable: true })
  saidaAutorizadaPorId: string | null;

  @Column({ type: 'datetime2', nullable: true })
  entradaValidadaEm: Date | null;

  @Column({ type: 'uniqueidentifier', nullable: true })
  entradaValidadaPorId: string | null;

  @Column({ type: 'datetime2', nullable: true })
  tipoPermissaoAlteradoEm: Date | null;

  @Column({ type: 'uniqueidentifier', nullable: true })
  tipoPermissaoAlteradoPorId: string | null;

  @Column({ type: 'datetime2', nullable: true })
  visualizadoSolicitanteEm: Date | null;

  @Column({ type: 'datetime2', nullable: true })
  visualizadoGestorEm: Date | null;

  @Column({ type: 'datetime2', nullable: true })
  visualizadoPortariaEm: Date | null;

  @Column({ type: 'datetime2', nullable: true })
  encerradoEm: Date | null;

  @Column({ type: 'uniqueidentifier', nullable: true })
  encerradoPorId: string | null;

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

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'saidaAutorizadaPorId' })
  saidaAutorizadaPor: User | null;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'entradaValidadaPorId' })
  entradaValidadaPor: User | null;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'tipoPermissaoAlteradoPorId' })
  tipoPermissaoAlteradoPor: User | null;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'encerradoPorId' })
  encerradoPor: User | null;

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
