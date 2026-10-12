import { mount } from '@vue/test-utils';
import { defineComponent, inject, nextTick, ref } from 'vue';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AbbyClient } from '@tryabby/core';
import { AbbyProvider } from '../provider';
import { ABBY_CLIENT_KEY } from '../constants';
import type { AbbyClientContext } from '../types';

// Mock the AbbyClient from @tryabby/core
vi.mock('@tryabby/core', () => {
  const mockAbbyClientInstance = {
    init: vi.fn(() => Promise.resolve()),
    getVariant: vi.fn(() => ({ name: 'control', payload: {} })),
    getFeatureFlag: vi.fn(() => true),
    getRemoteConfig: vi.fn(() => 'remoteValue'),
    onAct: vi.fn(),
  };
  return {
    AbbyClient: vi.fn(() => mockAbbyClientInstance),
  };
});

describe('AbbyProvider', () => {
  const mockConfig = {
    apiKey: 'test-api-key',
    userId: 'test-user-id',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize AbbyClient with the provided config', async () => {
    mount(AbbyProvider, {
      props: { config: mockConfig },
      slots: {
        default: '<div>Test</div>',
      },
    });

    expect(AbbyClient).toHaveBeenCalledTimes(1);
    expect(AbbyClient).toHaveBeenCalledWith(mockConfig);
    expect(AbbyClient.mock.results[0].value.init).toHaveBeenCalledTimes(1);
  });

  it('should provide the AbbyClient instance and initialization status to children', async () => {
    const ChildComponent = defineComponent({
      setup() {
        const context = inject(ABBY_CLIENT_KEY) as AbbyClientContext;
        return {
          client: context.client,
          isInitialized: context.isInitialized,
        };
      },
      template: `
        <div>
          <span id="is-initialized">{{ isInitialized }}</span>
        </div>
      `,
    });

    const wrapper = mount(AbbyProvider, {
      props: { config: mockConfig },
      slots: {
        default: ChildComponent,
      },
    });

    await nextTick(); // Wait for setup and init to potentially complete

    const child = wrapper.findComponent(ChildComponent);
    expect(child.exists()).toBe(true);
    expect(child.vm.client).toBeInstanceOf(AbbyClient);
    expect(child.vm.isInitialized.value).toBe(true); // Should be true after init resolves
    expect(wrapper.find('#is-initialized').text()).toBe('true');
  });

  it('should handle AbbyClient init failure gracefully', async () => {
    const mockError = new Error('Init failed');
    (AbbyClient.mock.results[0].value.init as vi.Mock).mockRejectedValueOnce(mockError);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const ChildComponent = defineComponent({
      setup() {
        const context = inject(ABBY_CLIENT_KEY) as AbbyClientContext;
        return {
          isInitialized: context.isInitialized,
        };
      },
      template: `<div>{{ isInitialized }}</div>`,
    });

    const wrapper = mount(AbbyProvider, {
      props: { config: mockConfig },
      slots: {
        default: ChildComponent,
      },
    });

    await nextTick(); // Wait for init to potentially complete
    await new Promise(resolve => setTimeout(resolve, 0)); // Ensure promise chain resolves

    const child = wrapper.findComponent(ChildComponent);
    expect(child.vm.isInitialized.value).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Abby client initialization failed:', mockError);

    consoleErrorSpy.mockRestore();
  });

  it('should react to config changes (though AbbyClient is typically initialized once)', async () => {
    const initialConfig = { apiKey: 'key1', userId: 'user1' };
    const updatedConfig = { apiKey: 'key2', userId: 'user2' };

    const wrapper = mount(AbbyProvider, {
      props: { config: initialConfig },
      slots: {
        default: '<div></div>',
      },
    });

    // Initial client creation and init
    expect(AbbyClient).toHaveBeenCalledWith(initialConfig);
    expect(AbbyClient.mock.results[0].value.init).toHaveBeenCalledTimes(1);

    // Update props
    await wrapper.setProps({ config: updatedConfig });
    await nextTick();

    // A new client should NOT be created, as AbbyClient is instantiated once in setup
    // and `watchEffect` on `config` prop doesn't re-instantiate `client`.
    // This test primarily verifies that the `AbbyClient` constructor is called only once.
    expect(AbbyClient).toHaveBeenCalledTimes(1);
    // The `init` method should also only be called once on the initial client.
    expect(AbbyClient.mock.results[0].value.init).toHaveBeenCalledTimes(1);
    // This confirms that AbbyClient is designed for single initialization per provider.
  });
});

