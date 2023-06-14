import { createAbby } from './createAbby.ts';

export const { getFeatureFlagValue, getABTestValue } = await createAbby({
	projectId: 'clfn3hs1t0002kx08x3kidi80',
	currentEnvironment: process.env.NODE_ENV,
	tests: {
		'New Test3': {
			variants: ['A', 'B']
		}
	},
	flags: ['lol', 'test3', 'testAbby'],
	flagCacheConfig: {
		refetchFlags: true,
		timeToLive: 1
	}
});

export const abby = { getFeatureFlagValue, getABTestValue };
