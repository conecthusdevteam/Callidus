import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cautela } from './cautela.entity';

@Entity({ name: 'cautela_items' })
export class CautelaItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  cautelaId: string;

  @Column({ length: 150 })
  nomeItem: string;

  @Column()
  quantidade: number;

  @CreateDateColumn({ type: 'datetime2' })
  criadoEm: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  atualizadoEm: Date;

  @ManyToOne(() => Cautela, (cautela) => cautela.itens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cautelaId' })
  cautela: Cautela;
}
