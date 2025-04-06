/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

export default {
	verbose: true,
	preset: "ts-jest/presets/js-with-ts-esm",
	testEnvironment: "jsdom",
	testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
	collectCoverage: true,
	collectCoverageFrom: ["src/**/*.ts"],
	coverageDirectory: "./.coverage",
	setupFiles: ["./tests/setup.ts"],
	transform: {
		"^.+\\.(ts|tsx)$": [
			"ts-jest",
			{
				useESM: true,
				tsconfig: "<rootDir>/tsconfig.json",
			},
		],
	},
	moduleNameMapper: {
		"lodash-es": "<rootDir>/tests/mocks/lodash-es.ts",
		"esdk-obs-browserjs": "<rootDir>/tests/mocks/ObsClientMock.ts",
		"^(\\.{1,2}/.*)\\.js$": "$1",
	},
	transformIgnorePatterns: ["node_modules/(?!(lodash-es)/)"],
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
	extensionsToTreatAsEsm: [".ts", ".tsx"],
	testTimeout: 60000,
	clearMocks: true,
	restoreMocks: true,
	resetMocks: false,
	errorOnDeprecated: true,
}
