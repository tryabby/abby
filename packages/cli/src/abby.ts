export const abby = {
    projectId: "environment.ABBY_PROJECT_ID",
    currentEnvironment: 'test',
    tests: {
        AngularTest: {
            variants: ['A', 'B', 'C', 'D'],
        },
        NotExistingTest: {
            variants: ['A', 'B'],
        },
    },
    flags: ['AngularFlag', 'AngularFlag2', 'NotExistingFlag'],
    apiUrl: 'http://localhost:3000/',
    debug: true,
};