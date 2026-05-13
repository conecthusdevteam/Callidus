import { nanoid } from 'nanoid';
import { BeforeInsert, Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { PlateWash } from './plate-wash.entity';

@Entity('plates')
export class Plate {
    @PrimaryColumn()
    id!: string;

    @Column({ name: 'modelo' })
    plateModel!: string;

    @Column({ name: 'serial', unique: true })
    serialNumber!: string;

    @Column({ name: 'blank_id' })
    blankId!: string;

    @Column({ name: 'linha' })
    lineName!: string;

    @Column({ name: 'id_fabricante', nullable: true })
    plateManufacturerId?: string;

    @Column({ name: 'pais_origem', nullable: true })
    country?: string;

    @Column({ name: 'espessura', type: 'decimal', precision: 5, scale: 3, nullable: true })
    thickness?: number;

    @Column({ name: 'enderecamento', nullable: true })
    addressing?: string;

    @OneToMany(() => PlateWash, (wash) => wash.plate)
    washes!: PlateWash[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @BeforeInsert()
    generateId() {
        this.id = `plate_${nanoid()}`
    }
}
