import { Mutation, Query, Resolver, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';
import { AuthToken } from './dto/auth-token.type';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Mutation(() => AuthToken)
  register(@Args('input') input: RegisterInput): Promise<AuthToken> {
    return this.authService.register(input);
  }

  @Public()
  @Mutation(() => AuthToken)
  login(@Args('input') input: LoginInput): Promise<AuthToken> {
    return this.authService.login(input);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => User)
  me(@CurrentUser() user: User): User {
    return user;
  }
}
