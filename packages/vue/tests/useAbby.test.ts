import { useAbby } from '../src/useAbby';
import { mount } from '@vue/test-utils';

test('useAbby returns correct variant', () => {
  const experimentName = 'test-experiment';
  const wrapper = mount({
    template: '<div>{{ variant }}</div>',
    setup() {
      const { variant } = useAbby(experimentName);
      return { variant };
    }
  });

  // Mock the result to match your expectations
  expect(wrapper.text()).toBe('variant-A'); // Assuming 'variant-A' is the expected result
});
