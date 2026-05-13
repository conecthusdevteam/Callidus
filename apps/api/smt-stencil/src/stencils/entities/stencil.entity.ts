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

  @Column({ name: 'codigo', unique: true })
  stencilCode!: string;

  @Column({ name: 'id_fabricante' })
  manufactureId!: string;

  @Column({ name: 'pais_origem' })
  country!: string;

  @Column('decimal', { name: 'espessura', precision: 6, scale: 4 })
  thickness!: number;

  @Column({ name: 'enderecamento' })
  addressing!: number;

  @Column({ name: 'linha' })
  lineName!: string;

  @Column({
    type: 'simple-enum',
    enum: WashStatus,
    default: WashStatus.ACTIVE,
  })
  status!: WashStatus;

  @OneToMany(() => StencilWash, (wash) => wash.stencil)
  washes!: StencilWash[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @BeforeInsert()
  generateId() {
    this.id = `stencil_${nanoid()}`;
  }
}
