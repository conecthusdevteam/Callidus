import { nanoid } from 'nanoid';
import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity('plates')
export class Plate {
    @PrimaryColumn()
    id!: string;

    @Column()
    plateModel!: string;

    @Column()
    serialNumber!: string;

    @Column()
    blankId!: string;

    @Column()
    shift!: number;

    @Column()
    phase!: number;

    @Column()
    totalWashes!: number;

    @Column()
    operator!: string;

    @Column()
    lineName!: string;

    @Column({ nullable: true })
    plateManufacturerId?: string;

    @Column({ nullable: true })
    country?: string;

    @Column({ type: 'decimal', precision: 5, scale: 3, nullable: true })
    thickness?: number;

    @Column({ nullable: true })
    addressing?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @BeforeInsert()
    generateId() {
        this.id = `plate_${nanoid()}`
    }
}
