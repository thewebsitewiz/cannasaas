import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}
  findById(id: string): Promise<User | null> { return this.repo.findOneBy({ id }); }
  findByEmail(email: string): Promise<User | null> { return this.repo.findOneBy({ email: email.toLowerCase() }); }
  async create(email: string, passwordHash: string): Promise<User> {
    const existing = await this.findByEmail(email);
    if (existing) throw new ConflictException('Email already registered');
    const user = this.repo.create({ email: email.toLowerCase(), passwordHash });
    return this.repo.save(user);
  }
}
