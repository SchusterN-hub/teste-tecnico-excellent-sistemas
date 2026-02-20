import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  razao_social: string;

  @Column({ unique: true })
  cnpj: string;

  @Column()
  email: string;

  @CreateDateColumn()
  createdAt: Date;
}
