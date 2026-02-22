import type { User } from '@cannasaas/types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Full implementation from Project Guide Section 4
// Key: persist only user + refreshToken, never accessToken
