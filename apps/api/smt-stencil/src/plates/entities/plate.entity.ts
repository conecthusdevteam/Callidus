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
import { PlateWash } from './plate-wash.entity';

@Entity('plates')
export class Plate {
  @PrimaryColumn()
  id!: string;

  @Column()
  plateModel!: string;

  @Column({ unique: true })
  serialNumber!: string;

  @Column()
  blankId!: string;

  @Column()
  lineName!: string;

  @Column({ nullable: true })
  plateManufacturerId?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 3,
    nullable: true,
  })
  thickness?: number;

  @Column({ nullable: true })
  addressing?: string;

  @OneToMany(() => PlateWash, (wash) => wash.plate)
  washes!: PlateWash[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @BeforeInsert()
  generateId() {
    this.id = `pt_${nanoid(8)}`;
  }
}
