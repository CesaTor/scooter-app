/**
 * Carthage build hook
 *
 * Copyright (c) 2019-present by Axway Appcelerator
 * All Rights Reserved.
 */

'use strict';

// eslint-disable-next-line security/detect-child-process
const spawn = require('child_process').spawn;
const path = require('path');

exports.id = 'ti.barcode.carthage';
exports.cliVersion = '>=3.2';
exports.init = init;

/**
 * Main entry point for our plugin which looks for the platform specific
 * plugin to invoke
 * @param {object} logger cli logger
 * @param {object} config cli configuration
 * @param {object} cli cli instance
 * @param {object} _appc node-appc library
 */
function init (logger, config, cli, _appc) {
	cli.on('build.module.pre.compile', {
		pre: function (builder, done) {
			logger.info('Running carthage...');

			// FIX for when platform dir doesn't already exist at builder init time. It assumes it's in the parent dir,
			// but here we force it to look in ios subdir since we generate the platform dir on the fly here
			builder.platformDir = path.join(builder.projectDir, 'platform');

			const p = spawn('carthage', [ 'bootstrap', '--platform', 'ios', '--cache-builds' ], { cwd: builder.projectDir });
			p.stderr.on('data', data => logger.error(data.toString().trim()));
			p.stdout.on('data', data => logger.trace(data.toString().trim()));
			p.on('close', function (code) {
				if (code !== 0) {
					return done(new Error(`Failed to run carthage properly, exited with code: ${code}`));
				}

				const fs = require('fs-extra');
				const subdirs = fs.readdirSync(path.join(builder.projectDir, 'Carthage/Build/iOS'));
				const frameworkDirs = subdirs.filter(dir => dir.endsWith('.framework'));
				for (const frameworkDir of frameworkDirs) {
					fs.copySync(path.join(builder.projectDir, 'Carthage/Build/iOS', frameworkDir), path.join(builder.projectDir, 'platform', frameworkDir));
				}
				done();
			});
		}
	});
}
