import { nanoid } from 'nanoid';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Stencil } from './stencil.entity';

@Entity('stencil_washes')
@Index(['stencilId', 'createdAt'])
export class StencilWash {
  @PrimaryColumn()
  id!: string;

  @Column()
  stencilId!: string;

  @ManyToOne(() => Stencil, (stencil) => stencil.washes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  stencil!: Stencil;

  @Column()
  operator!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @BeforeInsert()
  generateId() {
    this.id = `st_wsh_${nanoid()}`;
  }
}
