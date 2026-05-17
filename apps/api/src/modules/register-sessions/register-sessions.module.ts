import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegisterSession } from './entities/register-session.entity';
import { RegisterSessionService } from './register-session.service';
import { RegisterSessionResolver } from './register-session.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([RegisterSession])],
  providers: [RegisterSessionService, RegisterSessionResolver],
  exports: [RegisterSessionService],
})
export class RegisterSessionsModule {}
