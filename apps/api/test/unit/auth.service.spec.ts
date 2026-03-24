import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Inline entity stubs so we don't rely on barrel exports
class User {}
class RefreshToken {}

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepo: Record<string, jest.Mock>;
  let mockTokenRepo: Record<string, jest.Mock>;
  let mockJwt: Record<string, jest.Mock>;
  let mockConfig: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockUserRepo = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      create: jest.fn((dto) => ({ id: 'user-1', ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 'user-1', ...entity })),
      update: jest.fn(),
    };

    mockTokenRepo = {
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve(entity)),
      update: jest.fn(),
    };

    mockJwt = {
      sign: jest.fn().mockReturnValue('mock-access-token'),
    };

    mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'jwt.secret') return 'test-secret';
        if (key === 'jwt.accessTtl') return 900;
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(RefreshToken), useValue: mockTokenRepo },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should create user, hash password, and return tokens', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(null);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed-password');

      const result = await service.register({
        email: 'new@example.com',
        password: 'SecurePass1!',
      } as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('SecurePass1!', 12);
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@example.com', passwordHash: 'hashed-password' }),
      );
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
    });

    it('should reject duplicate email', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce({ id: 'existing-user', email: 'dup@example.com' });

      await expect(
        service.register({ email: 'dup@example.com', password: 'Pass123!' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const mockUser = {
      id: 'user-1',
      email: 'user@example.com',
      passwordHash: 'hashed-pw',
      role: 'admin',
      isActive: true,
      dispensaryId: 'disp-1',
      organizationId: 'org-1',
    };

    it('should return tokens for valid credentials', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.login({
        email: 'user@example.com',
        password: 'CorrectPass1!',
      } as any);

      expect(bcrypt.compare).toHaveBeenCalledWith('CorrectPass1!', 'hashed-pw');
      expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', expect.objectContaining({ lastLoginAt: expect.any(Date) }));
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw on wrong password', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.login({ email: 'user@example.com', password: 'WrongPass' } as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should return new token pair for valid refresh token', async () => {
      const storedToken = {
        id: 'token-1',
        userId: 'user-1',
        tokenHash: expect.any(String),
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000), // 1 day from now
      };
      mockTokenRepo.findOne.mockResolvedValueOnce(storedToken);
      mockUserRepo.findOneOrFail.mockResolvedValueOnce({
        id: 'user-1',
        email: 'user@example.com',
        role: 'admin',
        dispensaryId: 'disp-1',
        organizationId: 'org-1',
      });

      const result = await service.refresh('user-1', 'raw-refresh-token');

      expect(mockTokenRepo.update).toHaveBeenCalledWith('token-1', expect.objectContaining({ isRevoked: true }));
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('logout', () => {
    it('should revoke the token', async () => {
      await service.logout('user-1', 'raw-refresh-token');

      expect(mockTokenRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1' }),
        expect.objectContaining({ isRevoked: true, revokedAt: expect.any(Date) }),
      );
    });
  });
});
