import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * Marks a GraphQL field resolver as requiring specific roles.
 * Fields decorated with this will return null for unauthorized users
 * instead of throwing an error (graceful degradation).
 *
 * Usage on a @ResolveField():
 *   @FieldRoles('dispensary_admin', 'org_admin', 'super_admin')
 */
export const FIELD_ROLES_KEY = 'fieldRoles';
export const FieldRoles = (...roles: string[]) => SetMetadata(FIELD_ROLES_KEY, roles);
