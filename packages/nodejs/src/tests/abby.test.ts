import { expect, test, describe } from 'vitest';
import { createAbby } from '../abby/createAbby.ts';

describe('it works', () => {
	test('getFeatureFlagValue working', async () => {
		const { getABTestValue, getFeatureFlagValue } = await createAbby({
			projectId: '',
			tests: {},
			flags: ['flag1', 'flag2']
		});

		console.log(await getFeatureFlagValue('flag1'));

		expect(await getFeatureFlagValue('flag1')).toBeTruthy();
		expect(await getFeatureFlagValue('flag2')).toBeFalsy();
	});

	test('getABTestValue working', async () => {
		const { getABTestValue, getFeatureFlagValue } = await createAbby({
			projectId: '',
			tests: {
				'New Test1': {}
			}
		});
	});
});
