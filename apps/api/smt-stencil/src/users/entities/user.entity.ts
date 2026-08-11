import { nanoid } from 'nanoid';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserArea {
  OPERATION = 'operacao',
  ENGINEERING = 'engenharia',
  QUALITY = 'qualidade',
  ADMIN = 'admin',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Index({ unique: true })
  @Column()
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({
    type: 'simple-enum',
    enum: UserArea,
    default: UserArea.OPERATION,
  })
  area!: UserArea;

  @Column({
    type: 'simple-enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 0 })
  loginAttempts!: number;

  @Column({ type: 'datetime2', nullable: true })
  lockedUntil!: Date | null;

  @Column({ type: 'datetime2', nullable: true })
  lastLoginAt!: Date | null;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  refreshTokenHash!: string | null;

  @Column({ type: 'datetime2', nullable: true })
  refreshTokenExpiresAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @BeforeInsert()
  generateId() {
    this.id = `usr_${nanoid(8)}`;
  }
}
