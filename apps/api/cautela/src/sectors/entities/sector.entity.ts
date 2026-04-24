import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cautela } from '../../cautela/entities/cautela.entity';
import { User } from '../../user/entities/user.entity';

@Entity({ name: 'sectors' })
export class Sector {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  numeroSetor: number;

  @Column({ length: 150 })
  nome: string;

  @Column()
  gestorId: string;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn({ type: 'datetime2' })
  criadoEm: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  atualizadoEm: Date;

  @ManyToOne(() => User, (user) => user.setoresGerenciados, { eager: false })
  @JoinColumn({ name: 'gestorId' })
  gestor: User;

  @OneToMany(() => Cautela, (cautela) => cautela.setor)
  cautelas: Cautela[];
}
