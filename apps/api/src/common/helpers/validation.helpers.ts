import { BadRequestException, NotFoundException } from '@nestjs/common';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateUUID(value: string, fieldName = 'id'): void {
  if (!value || !UUID_REGEX.test(value)) throw new BadRequestException('Invalid ' + fieldName + ': must be a valid UUID');
}

export function validateDateString(value: string, fieldName = 'date'): void {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new BadRequestException(fieldName + ' must be in YYYY-MM-DD format');
  if (isNaN(new Date(value).getTime())) throw new BadRequestException(fieldName + ' is not a valid date');
}

export function validatePositiveNumber(value: number, fieldName = 'value'): void {
  if (value === undefined || value === null || isNaN(value) || value <= 0) throw new BadRequestException(fieldName + ' must be a positive number');
}

export function validateRange(value: number, min: number, max: number, fieldName = 'value'): void {
  if (value < min || value > max) throw new BadRequestException(fieldName + ' must be between ' + min + ' and ' + max);
}

export function validateEmail(value: string): void {
  if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new BadRequestException('Invalid email address');
}

export function ensureFound<T>(value: T | null | undefined, entityName = 'Record'): T {
  if (!value) throw new NotFoundException(entityName + ' not found');
  return value;
}
