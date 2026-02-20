import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserRole } from './role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    const adminEmail = 'admin@admin.com';
    const adminExists = await this.usersRepository.findOneBy({
      email: adminEmail,
    });

    if (!adminExists) {
      console.log('--- SEEDING ADMIN USER ---');
      const passwordHash = await bcrypt.hash('123456', 10);
      const admin = this.usersRepository.create({
        name: 'Administrador',
        email: adminEmail,
        password: passwordHash,
        role: UserRole.ADMIN,
      });
      await this.usersRepository.save(admin);
      console.log('Admin criado: admin@admin.com / 123456');
    }
  }

  async create(createUserDto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: passwordHash,
      role: UserRole.USUARIO,
    });

    return this.usersRepository.save(user);
  }

  findAll() {
    return this.usersRepository.find({
      select: ['id', 'name', 'email', 'role', 'createdAt'],
    });
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'role', 'createdAt'],
    });
    if (!user) throw new NotFoundException(`Usuário ID ${id} não encontrado`);
    return user;
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    this.usersRepository.merge(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    return this.usersRepository.remove(user);
  }
}
