import { Mutation, Resolver, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';
import { AuthToken } from './dto/auth-token.type';
import { Public } from '../../common/decorators/public.decorator';

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
}
