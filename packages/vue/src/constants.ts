import type { InjectionKey } from 'vue';
import type { AbbyClientContext } from './types';

/**
 * Injection key for the Abby client context.
 */
export const ABBY_CLIENT_KEY: InjectionKey<AbbyClientContext> = Symbol('AbbyClient');

