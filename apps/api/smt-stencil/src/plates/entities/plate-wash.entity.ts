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
import { Plate } from './plate.entity';

@Entity('plate_washes')
@Index(['plateId', 'createdAt'])
export class PlateWash {
  @PrimaryColumn()
  id!: string;

  @Column()
  plateId!: string;

  @ManyToOne(() => Plate, (plate) => plate.washes, { onDelete: 'CASCADE' })
  @JoinColumn()
  plate!: Plate;

  @Column()
  operator!: string;

  @Column()
  shift!: number;

  @Column()
  phase!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @BeforeInsert()
  generateId() {
    this.id = `pw_${nanoid(8)}`;
  }
}
