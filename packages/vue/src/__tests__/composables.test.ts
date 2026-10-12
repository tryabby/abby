import { mount } from '@vue/test-utils';
import { defineComponent, provide, ref, nextTick } from 'vue';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AbbyClient } from '@tryabby/core';
import { ABBY_CLIENT_KEY } from '../constants';
import { useAbby, useFeatureFlag, useRemoteConfig } from '../composables';
import type { AbbyClientContext } from '../types';

// Mock the AbbyClient from @tryabby/core
const mockAbbyClientInstance = {
  init: vi.fn(() => Promise.resolve()),
  getVariant: vi.fn(() => ({ name: 'control', payload: {} })),
  getFeatureFlag: vi.fn(() => true),
  getRemoteConfig: vi.fn(() => 'remoteValue'),
  onAct: vi.fn(),
};

vi.mock('@tryabby/core', () => {
  return {
    AbbyClient: vi.fn(() => mockAbbyClientInstance),
  };
});

describe('Abby Composables', () => {
  const createTestComponent = (composableHook: Function, hookArgs?: any[]) =>
    defineComponent({
      setup() {
        // Provide a mock AbbyClient context for testing composables in isolation
        const isInitialized = ref(true);
        const client = mockAbbyClientInstance as unknown as AbbyClient;
        const context: AbbyClientContext = { client, isInitialized };
        provide(ABBY_CLIENT_KEY, context);

        if (hookArgs) {
          return { result: composableHook(...hookArgs) };
        }
        return { result: composableHook() };
      },
      template: '<div />',
    });

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock return values for each test
    mockAbbyClientInstance.getVariant.mockReturnValue({ name: 'control', payload: {} });
    mockAbbyClientInstance.getFeatureFlag.mockReturnValue(true);
    mockAbbyClientInstance.getRemoteConfig.mockReturnValue('remoteValue');
  });

  describe('useAbby', () => {
    it('should return the variant and onAct method', async () => {
      const TestComponent = createTestComponent(useAbby);
      const wrapper = mount(TestComponent);

      const { variant, onAct, isInitialized } = wrapper.vm.result;

      expect(variant.value).toEqual({ name: 'control', payload: {} });
      expect(typeof onAct).toBe('function');
      expect(isInitialized.value).toBe(true);
      expect(mockAbbyClientInstance.getVariant).toHaveBeenCalledTimes(1);

      onAct('test_action', { key: 'value' });
      expect(mockAbbyClientInstance.onAct).toHaveBeenCalledWith('test_action', { key: 'value' });
    });

    it('should update variant reactively when client state changes (simulated)', async () => {
      const TestComponent = defineComponent({
        setup() {
          const isInitialized = ref(true);
          const client = mockAbbyClientInstance as unknown as AbbyClient;
          const context: AbbyClientContext = { client, isInitialized };
          provide(ABBY_CLIENT_KEY, context);

          const { variant } = useAbby();
          return { variant };
        },
        template: `<div>{{ variant?.name }}</div>`,
      });

      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toBe('control');

      mockAbbyClientInstance.getVariant.mockReturnValue({ name: 'variantA', payload: {} });
      // Trigger reactivity by forcing a re-render or state change that would re-evaluate watchEffect
      // In a real app, this would happen if AbbyClient itself emitted an event or its internal state changed.
      // For testing, we can manually trigger a component update or re-mount.
      // A more robust solution would involve the mock client having an observable state.
      // For now, we simulate by re-mounting or updating a prop if the component was designed to react to it.
      // Since `watchEffect` runs on dependency changes, we need to ensure `getVariant` is re-evaluated.
      // The current `watchEffect` in `useAbby` depends on `isInitialized.value` and `client`.
      // To simulate a variant change, we'd ideally have the mock client notify.
      // For this test, we'll assume `getVariant` is called when `isInitialized` changes or on initial setup.
      // Let's simulate a re-evaluation by changing a reactive dependency.
      // A simpler way to test reactivity is to directly change the mock's return value and then
      // trigger a re-render if the composable's dependencies were to change.
      // For `getVariant`, it's called inside `watchEffect` which runs on `isInitialized` change.
      // Let's simulate a change in `isInitialized` to trigger the `watchEffect`.
      const isInitializedRef = (wrapper.vm as any).result?.isInitialized || ref(true); // Access the ref from the component instance
      isInitializedRef.value = false;
      await nextTick();
      isInitializedRef.value = true;
      await nextTick();

      expect(wrapper.text()).toBe('variantA');
      expect(mockAbbyClientInstance.getVariant).toHaveBeenCalledTimes(2); // Initial + after isInitialized change
    });

    it('should return null variant if not initialized', async () => {
      const TestComponent = defineComponent({
        setup() {
          const isInitialized = ref(false); // Simulate not initialized
          const client = mockAbbyClientInstance as unknown as AbbyClient;
          const context: AbbyClientContext = { client, isInitialized };
          provide(ABBY_CLIENT_KEY, context);

          const { variant, isInitialized: hookIsInitialized } = useAbby();
          return { variant, hookIsInitialized };
        },
        template: `<div>{{ variant?.name }}</div>`,
      });

      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toBe('');
      expect(wrapper.vm.variant.value).toBeNull();
      expect(wrapper.vm.hookIsInitialized.value).toBe(false);
      expect(mockAbbyClientInstance.getVariant).not.toHaveBeenCalled();
    });

    it('should warn if onAct is called when client is not available', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const TestComponent = defineComponent({
        setup() {
          // Provide a context with null client to simulate unavailability
          const isInitialized = ref(false);
          const context: AbbyClientContext = { client: null, isInitialized };
          provide(ABBY_CLIENT_KEY, context);
          const { onAct } = useAbby();
          return { onAct };
        },
        template: '<div />',
      });
      const wrapper = mount(TestComponent);
      wrapper.vm.onAct('test');
      expect(consoleWarnSpy).toHaveBeenCalledWith('AbbyClient not available. Cannot call onAct.');
      expect(mockAbbyClientInstance.onAct).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('useFeatureFlag', () => {
    it('should return the reactive feature flag value', async () => {
      const TestComponent = createTestComponent(useFeatureFlag, ['myFlag']);
      const wrapper = mount(TestComponent);

      const flagValue = wrapper.vm.result;
      expect(flagValue.value).toBe(true);
      expect(mockAbbyClientInstance.getFeatureFlag).toHaveBeenCalledWith('myFlag');

      mockAbbyClientInstance.getFeatureFlag.mockReturnValue(false);
      // Trigger reactivity by changing a dependency or forcing re-render
      const isInitializedRef = (wrapper.vm as any).result?.isInitialized || ref(true);
      isInitializedRef.value = false;
      await nextTick();
      isInitializedRef.value = true;
      await nextTick();

      expect(flagValue.value).toBe(false);
      expect(mockAbbyClientInstance.getFeatureFlag).toHaveBeenCalledWith('myFlag');
      expect(mockAbbyClientInstance.getFeatureFlag).toHaveBeenCalledTimes(2);
    });

    it('should return null if not initialized', async () => {
      const TestComponent = defineComponent({
        setup() {
          const isInitialized = ref(false);
          const client = mockAbbyClientInstance as unknown as AbbyClient;
          const context: AbbyClientContext = { client, isInitialized };
          provide(ABBY_CLIENT_KEY, context);
          return { flag: useFeatureFlag('myFlag') };
        },
        template: `<div>{{ flag }}</div>`,
      });
      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toBe('');
      expect(wrapper.vm.flag.value).toBeNull();
      expect(mockAbbyClientInstance.getFeatureFlag).not.toHaveBeenCalled();
    });
  });

  describe('useRemoteConfig', () => {
    it('should return the reactive remote config value', async () => {
      const TestComponent = createTestComponent(useRemoteConfig, ['myConfig']);
      const wrapper = mount(TestComponent);

      const configValue = wrapper.vm.result;
      expect(configValue.value).toBe('remoteValue');
      expect(mockAbbyClientInstance.getRemoteConfig).toHaveBeenCalledWith('myConfig');

      mockAbbyClientInstance.getRemoteConfig.mockReturnValue(123);
      // Trigger reactivity
      const isInitializedRef = (wrapper.vm as any).result?.isInitialized || ref(true);
      isInitializedRef.value = false;
      await nextTick();
      isInitializedRef.value = true;
      await nextTick();

      expect(configValue.value).toBe(123);
      expect(mockAbbyClientInstance.getRemoteConfig).toHaveBeenCalledWith('myConfig');
      expect(mockAbbyClientInstance.getRemoteConfig).toHaveBeenCalledTimes(2);
    });

    it('should return null if not initialized', async () => {
      const TestComponent = defineComponent({
        setup() {
          const isInitialized = ref(false);
          const client = mockAbbyClientInstance as unknown as AbbyClient;
          const context: AbbyClientContext = { client, isInitialized };
          provide(ABBY_CLIENT_KEY, context);
          return { config: useRemoteConfig('myConfig') };
        },
        template: `<div>{{ config }}</div>`,
      });
      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toBe('');
      expect(wrapper.vm.config.value).toBeNull();
      expect(mockAbbyClientInstance.getRemoteConfig).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('useAbby should throw an error if not used within AbbyProvider', () => {
      const TestComponent = defineComponent({
        setup() {
          return { result: useAbby() };
        },
        template: '<div />',
      });
      expect(() => mount(TestComponent)).toThrow(
        'AbbyClient is not initialized. Please ensure you are using useAbby, useFeatureFlag, or useRemoteConfig within an <AbbyProvider>.'
      );
    });

    it('useFeatureFlag should throw an error if not used within AbbyProvider', () => {
      const TestComponent = defineComponent({
        setup() {
          return { result: useFeatureFlag('test') };
        },
        template: '<div />',
      });
      expect(() => mount(TestComponent)).toThrow(
        'AbbyClient is not initialized. Please ensure you are using useAbby, useFeatureFlag, or useRemoteConfig within an <AbbyProvider>.'
      );
    });

    it('useRemoteConfig should throw an error if not used within AbbyProvider', () => {
      const TestComponent = defineComponent({
        setup() {
          return { result: useRemoteConfig('test') };
        },
        template: '<div />',
      });
      expect(() => mount(TestComponent)).toThrow(
        'AbbyClient is not initialized. Please ensure you are using useAbby, useFeatureFlag, or useRemoteConfig within an <AbbyProvider>.'
      );
    });
  });
});

