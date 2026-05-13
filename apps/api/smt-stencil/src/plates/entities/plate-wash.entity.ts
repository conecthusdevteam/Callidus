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

@Entity('lavagens_placa')
@Index(['plateId', 'createdAt'])
export class PlateWash {
  @PrimaryColumn()
  id!: string;

  @Column({ name: 'placa_id' })
  plateId!: string;

  @ManyToOne(() => Plate, (plate) => plate.washes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'placa_id' })
  plate!: Plate;

  @Column({ name: 'operador' })
  operator!: string;

  @Column({ name: 'turno' })
  shift!: number;

  @Column({ name: 'fase' })
  phase!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @BeforeInsert()
  generateId() {
    this.id = `plate_wash_${nanoid()}`;
  }
}
