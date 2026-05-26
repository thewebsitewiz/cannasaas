/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project; Jest globals lose types.

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Role } from '../../src/modules/auth/enums/role.enum';
import { User } from '../../src/modules/users/entities/user.entity';
import { UsersService } from '../../src/modules/users/users.service';

describe('UsersService.invite (sc-683)', () => {
  let service: UsersService;
  let repo: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findOneBy: jest.fn(),
      create: jest
        .fn()
        .mockImplementation((data: object) => ({ ...data, id: 'u-new' })),
      save: jest.fn().mockImplementation((u: object) => Promise.resolve(u)),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  it('throws Conflict when the email is already taken', async () => {
    repo.findOneBy.mockResolvedValueOnce({ id: 'u-old', email: 'a@a.com' });
    await expect(
      service.invite({
        email: 'a@a.com',
        dispensaryId: 'd-1',
        role: Role.BUDTENDER,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('lowercases the email + hashes the temp password + persists', async () => {
    repo.findOneBy.mockResolvedValueOnce(null);
    const result = await service.invite({
      email: 'Alice@Example.com',
      dispensaryId: 'd-1',
      role: Role.BUDTENDER,
      firstName: 'Alice',
      lastName: 'Lov',
    });
    expect(result.temporaryPassword).toMatch(/^[A-Za-z0-9_-]{16}$/);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'alice@example.com',
        role: Role.BUDTENDER,
        dispensaryId: 'd-1',
        firstName: 'Alice',
        lastName: 'Lov',
        isActive: true,
        emailVerified: false,
      }),
    );
    const createArg = repo.create.mock.calls[0][0] as { passwordHash: string };
    // bcrypt format: $2[ab]$<cost>$<22-char salt><31-char hash>
    expect(createArg.passwordHash).toMatch(/^\$2[ab]\$/);
    expect(repo.save).toHaveBeenCalled();
  });

  it('returns the persisted user as result.user', async () => {
    repo.findOneBy.mockResolvedValueOnce(null);
    const result = await service.invite({
      email: 'b@b.com',
      dispensaryId: 'd-1',
      role: Role.DISPENSARY_ADMIN,
    });
    expect(result.user.email).toBe('b@b.com');
    expect(result.user.role).toBe(Role.DISPENSARY_ADMIN);
    expect(result.user.dispensaryId).toBe('d-1');
  });
});
