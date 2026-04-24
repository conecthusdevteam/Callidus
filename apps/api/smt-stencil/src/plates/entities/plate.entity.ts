import { nanoId } from 'nano-id';
import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity('plates')
export class Plate {
    @PrimaryColumn()
    id!: string;

    @Column({ unique: true })
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

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @BeforeInsert()
    generateId() {
        this.id = `plate_${nanoId()}`
    }
}
