import { nanoId } from 'nano-id';
import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

export enum WashStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

@Entity('stencils')
export class Stencil {
    @PrimaryColumn()
    id!: string;

    @Column({ unique: true })
    stencilCode!: string;

    @Column()
    manufactureId!: string;

    @Column()
    country!: string;

    @Column()
    thickness!: number;

    @Column()
    addressing!: number;

    @Column()
    totalWashes!: number;

    @Column()
    operator!: string;

    @Column()
    lineName!: string;

    @Column({
        type: 'simple-enum',
        enum: WashStatus,
        default: WashStatus.ACTIVE,
    })
    status!: WashStatus;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @BeforeInsert()
    generateId() {
        this.id = `stencil_${nanoId()}`
    }
}
