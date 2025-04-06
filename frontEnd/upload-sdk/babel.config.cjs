module.exports = {
	presets: [
		[
			"@babel/preset-env",
			{
				loose: true,
				targets: {
					node: "current",
				},
				modules: false,
			},
		],
		"@babel/preset-typescript",
	],
	plugins: [
		[
			"transform-react-remove-prop-types",
			{
				mode: "remove",
				removeImport: true,
				ignoreFilenames: ["node_modules"],
			},
		],
		["@babel/plugin-transform-runtime", { useESModules: true }],
	],
	env: {
		test: {
			presets: [
				[
					"@babel/preset-env",
					{
						targets: { node: "current" },
						modules: "auto",
					},
				],
			],
		},
	},
}
