import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Cautela } from './cautela.entity';

@Entity({ name: 'cautela_events' })
export class CautelaEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  cautelaId: string;

  @Column({ length: 30 })
  acao: string;

  @Column({ type: 'nvarchar', length: 'max' })
  descricao: string;

  @Column({ name: 'feitoPorId' })
  feitoPorId: string;

  @CreateDateColumn({ name: 'timestamp', type: 'datetime2' })
  timestamp: Date;

  @ManyToOne(() => Cautela, (cautela) => cautela.eventos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cautelaId' })
  cautela: Cautela;

  @ManyToOne(() => User, (user) => user.eventos, { eager: false })
  @JoinColumn({ name: 'feitoPorId' })
  feitoPor: User;
}
