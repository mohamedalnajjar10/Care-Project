export default {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    roots: ['<rootDir>', '../prisma'],
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: ['**/*.(t|j)s'],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/$1',
        '^prisma/(.*)$': '<rootDir>/../prisma/$1',
    },
};