import { nanoid } from 'nanoid';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StencilWash } from './stencil-wash.entity';

export enum WashStatus {
  VALIDATION = 'validation',
  ACTIVE = 'active',
  OBSOLETE = 'obsolete',
  DISCARDED = 'discarded',
}

export enum StencilPhase {
  FIRST = '1F',
  SECOND = '2F',
  UNIQUE = 'FU',
}

export enum StencilApprovalStatus {
  OK = 'ok',
  FAIL = 'fail',
}

export enum StencilTechnicalOpinion {
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('stencils')
export class Stencil {
  @PrimaryColumn()
  id!: string;

  @Column({ unique: true })
  stencilCode!: string;

  @Column({ nullable: true })
  plateModel?: string;

  @Column({ nullable: true })
  plateType?: string;

  @Column({ nullable: true })
  version?: string;

  @Column({
    type: 'simple-enum',
    enum: StencilPhase,
    nullable: true,
  })
  phase?: StencilPhase;

  @Column({ nullable: true })
  copy?: string;

  @Column()
  manufactureId!: string;

  @Column()
  country!: string;

  @Column('decimal', { precision: 6, scale: 4 })
  thickness!: number;

  @Column()
  addressing!: string;

  @Column({ type: 'date', nullable: true })
  manufacturedAt?: Date;

  @Column({
    type: 'simple-enum',
    enum: StencilApprovalStatus,
    default: StencilApprovalStatus.OK,
  })
  serigraphy!: StencilApprovalStatus;

  @Column({
    type: 'simple-enum',
    enum: StencilApprovalStatus,
    default: StencilApprovalStatus.OK,
  })
  fiducials!: StencilApprovalStatus;

  @Column({
    type: 'simple-enum',
    enum: StencilApprovalStatus,
    default: StencilApprovalStatus.OK,
  })
  finishing!: StencilApprovalStatus;

  @Column({
    type: 'simple-enum',
    enum: StencilTechnicalOpinion,
    default: StencilTechnicalOpinion.APPROVED,
  })
  technicalOpinion!: StencilTechnicalOpinion;

  @Column()
  lineName!: string;

  @Column({
    type: 'simple-enum',
    enum: WashStatus,
    default: WashStatus.VALIDATION,
  })
  status!: WashStatus;

  @OneToMany(() => StencilWash, (wash) => wash.stencil)
  washes!: StencilWash[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @BeforeInsert()
  generateId() {
    this.id = `st_${nanoid(8)}`;
  }
}
