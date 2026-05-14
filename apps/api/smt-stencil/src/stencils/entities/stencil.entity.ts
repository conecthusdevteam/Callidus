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
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('stencils')
export class Stencil {
  @PrimaryColumn()
  id!: string;

  @Column({ unique: true })
  stencilCode!: string;

  @Column()
  manufactureId!: string;

  @Column()
  country!: string;

  @Column('decimal', { precision: 6, scale: 4 })
  thickness!: number;

  @Column()
  addressing!: number;

  @Column()
  lineName!: string;

  @Column({
    type: 'simple-enum',
    enum: WashStatus,
    default: WashStatus.ACTIVE,
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
    this.id = `st_${nanoid()}`;
  }
}
