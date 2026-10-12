import { defineComponent, provide, ref, watchEffect, toRefs } from 'vue';
import { AbbyClient } from '@tryabby/core';
import type { AbbyConfig } from '@tryabby/core';
import { ABBY_CLIENT_KEY } from './constants';
import type { AbbyClientContext } from './types';

/**
 * Props for the AbbyProvider component.
 */
interface AbbyProviderProps {
  config: AbbyConfig;
}

/**
 * AbbyProvider component.
 * This component initializes the Abby client and makes it available to all child components
 * via Vue's provide/inject mechanism.
 */
export const AbbyProvider = defineComponent({
  name: 'AbbyProvider',
  props: {
    config: {
      type: Object,
      required: true,
    },
  },
  setup(props: AbbyProviderProps, { slots }) {
    const { config } = toRefs(props);
    const client = new AbbyClient(config.value);
    const isInitialized = ref(false);

    // Initialize Abby client and update initialization status
    watchEffect(async () => {
      try {
        await client.init();
        isInitialized.value = true;
      } catch (error) {
        console.error('Abby client initialization failed:', error);
        isInitialized.value = false;
      }
    });

    // Provide the client and its initialization status to child components
    const context: AbbyClientContext = {
      client,
      isInitialized,
    };
    provide(ABBY_CLIENT_KEY, context);

    return () => slots.default?.();
  },
});

