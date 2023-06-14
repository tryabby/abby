import { expect, test, describe } from 'vitest';
import { createAbby } from '../abby/createAbby.ts';

describe('it works', () => {
	test('getFeatureFlagValue working', async () => {
		const { getFeatureFlagValue } = await createAbby({
			projectId: '123',
			tests: {},
			flags: ['flag1', 'flag2']
		});

		expect(await getFeatureFlagValue('flag1')).toBeTruthy();
		expect(await getFeatureFlagValue('flag2')).toBeFalsy();
	});

	test('it returns a correct variant', async () => {
		const variants = ['A', 'B', 'C', 'D'];
		const { getABTestValue } = await createAbby({
			projectId: '123',
			tests: {
				test: {
					variants
				}
			}
		});

		const variant = getABTestValue('test');

		expect(variant).toContain(variant);
	});

	test('it returns a correct variant with respect to the weights', async () => {
		const variants = ['A', 'B'];
		const { getABTestValue } = await createAbby({
			projectId: '123',
			tests: {
				test: {
					variants
				}
			}
		});

		const variant = getABTestValue('test');

		expect(variant).toBe('A');
	});
});
