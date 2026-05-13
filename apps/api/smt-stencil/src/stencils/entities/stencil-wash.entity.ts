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

@Entity('lavagens_stencil')
@Index(['stencilId', 'createdAt'])
export class StencilWash {
  @PrimaryColumn()
  id!: string;

  @Column({ name: 'stencil_id' })
  stencilId!: string;

  @ManyToOne(() => Stencil, (stencil) => stencil.washes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'stencil_id' })
  stencil!: Stencil;

  @Column({ name: 'operador' })
  operator!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @BeforeInsert()
  generateId() {
    this.id = `stencil_wash_${nanoid()}`;
  }
}
