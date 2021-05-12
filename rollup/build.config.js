import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'

const jsExtensions = ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json', '.node']

module.exports = {
	input: 'src/index.ts',
	output: [
		{
			file: 'dist/index.js',
			format: 'cjs',
			exports: 'named',
		},
		{
			file: 'dist/index.mjs',
			format: 'esm',
		}
	],
	external: [
    ...Object.keys(require('../package.json').dependencies || {}),
    ...Object.keys(require('../package.json').devDependencies),
  ],
	plugins: [
		babel({
			babelrc: true,
			exclude: 'node_modules/**',
			extensions: jsExtensions
		}),
		resolve({
			extensions: jsExtensions
		}),
		commonjs(),
	]
}
