import { nanoId } from 'nano-id';
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
    totalWashes!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @Column()
    operator!: string;

    @Column()
    shift!: number;

    @Column()
    phase!: number;

    @Column()
    lineName!: string;

    @BeforeInsert()
    generateId() {
        this.id = `plate_${nanoId()}`
    }
}
