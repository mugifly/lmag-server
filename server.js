/**
 * lmag-server - Unofficial WebAPI server for mag (door sensor)
 * https://github.com/mugifly/lmag-server
 * (C) 2018 - mugifly; Released under MIT License.
 **/

'use strict';


const express = require('express');
const app = express();

const MagMonitor = require(`${__dirname}/libs/mag-monitor`);
const magMonitor = new MagMonitor();


/**
 * GET - /
 */
app.get('/', (req, res) => {

	res.send('lmag-server');

});


/**
 * GET - /:address
 */
app.get('/:address', (req, res) => {

	// Get a parameter
	let address = req.params.address;
	if (address === null) {
		return res.status(400).send('Invalid arguments');
	} else if (!address.match(/[a-z0-9]{2,2}:[a-z0-9]{2,2}:[a-z0-9]{2,2}:[a-z0-9]{2,2}:[a-z0-9]{2,2}:[a-z0-9]{2,2}/i)) {
		return res.status(400).send('Invalid MAC address');
	}

	address = address.replace(/:/g, '');

	// Check for whether the device is registered for monitoring
	if (!magMonitor.existsDevice(address)) { // If unregistered yet
		// Register the sensor device to monitor state
		magMonitor.registerDevice(address);
	}

	// Get a latest sensor status of the device
	magMonitor.getLatestSensorStatusByDeviceAddress(address).then((status) => {

		// Send a response
		res.send({
			status: status
		});

	}).catch((err) => {

		// Send a response as an error
		res.status(400).send({
			error: err.toString(),
			status: 'UNKNOWN'
		});

	});

});


// Start the server
const listener = app.listen(process.env.port || 3000, () => {

	console.log('lmag-server server listening on localhost:' + listener.address().port);

});
