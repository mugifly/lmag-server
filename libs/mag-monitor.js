/**
 * MagMonitor
 * (C) 2018 - mugifly; Released under MIT License.
 **/

'use strict';


const noble = require('noble');


class MagMonitor {


	/**
	 * Initializer
	 * @public
	 */
	constructor () {

		// UUID of Sensor Service
		this.SENSOR_SERVICE_UUID = '3c111002c75c50c41f1a6789e2afde4e';

		// UUID of Sensor Characteristic
		this.SENSOR_CHARACTERISTIC_UUID = '3c113000c75c50c41f1a6789e2afde4e';

		// A list of the sensor devices to be monitored
		this.devices = {};

		// A listener that will be called when the sensor state is changed
		this.onSensorStatusChangedListener = null;

		// Initialize and Start first scanning to discover the peripherals
		this.scannerTimer = null;
		this.initScanner();

		// For debugging
		setInterval(() => {
			this.printCurrentDevices();
		}, 200000);

	}


	/**
	 * A method to register the sensor device to monitor state
	 * @param  {String} address Address of the sensor device (e.g. 'xxxxxxxxxxxx')
	 * @return {Promise}
	 */
	async registerDevice (address) {

		return new Promise((resolve, reject) => {

			console.log(`Registering the device... ${address}`);

			// Add the device to monitored devices list
			this.devices[address] = {
				peripheral: null,
				sensorStatus: null,
				subscribing: false
			};

			// Re-start scanning of the peripherals (sensor devices)
			this.restartScanner();

		});

	}


	/**
	 * A method to unregister the sensor device
	 * @public
	 * @param  {String} address Address of the sensor device (e.g. 'xxxxxxxxxxxx')
	 * @return {Promise}
	 */
	async unregisterDevice (address) {

		return new Promise((resolve, reject) => {

			console.log(`Unregister the device: ${address}`);

			// Delete the device from the list
			delete this.devices[address];

			// Done
			resolve();

		});

	}


	/**
	 * Get a latest sensor status of the device
	 * @public
	 * @param  {String} address Address of the sensor device
	 * @return {Promise<String>} 'OPEN', 'CLOSE'
	 */
	async getLatestSensorStatusByDeviceAddress (address) {

		return new Promise((resolve, reject) => {

			if (!this.devices[address]) {
				return reject(new Error('Device is not registered.'));
			}

			if (this.devices[address].sensorStatus === null) {
				return reject(new Error('Sensor Status is null.'));
			}

			return resolve(this.devices[address].sensorStatus);

		});

	}


	/**
	 * A method to get whether the device is registered for monitoring
	 * @public
	 * @param  {String} address Address of the sensor device (e.g. 'xxxxxxxxxxxx')
	 * @return {Boolean}
	 */
	existsDevice (address) {

		return (address in this.devices);

	}


	/**
	 * A method to set an event listener about the sensor status
	 * @public
	 * @param  {Function} listener An listener - function (address, status)
	 */
	setOnSensorStatusChangedListener (listener) {

		this.onSensorStatusChangedListener = listener;

	}


	/**
	 * A method to show the current devices list
	 * @private
	 */
	printCurrentDevices () {

		let statuses = '----- DEVICES -----\n';

		for (const address of Object.keys(this.devices)) {

			statuses += address + ' - ';

			if (this.devices[address].peripheral) {
				statuses += 'CONNECTED ';
			} else {
				statuses += 'DISCONNECTED ';
			}

			if (this.devices[address].subscribing) {
				statuses += 'SUBSCRIBING';
			} else {
				statuses += 'UNSUBSCRIBING';
			}

			statuses += '\n';

		}

		statuses += '----------\n';

		console.log(statuses);

	}


	/**
	 * Initialize and Start first scanning of peripherals that matched with registered monitoring devices
	 * @private
	 * @return {Promise}
	 */
	initScanner () {

		console.log('initScanner');

		// Set an event handler that will be called when the peripheral is discovered
		noble.on('discover', (peripheral) => {

			this.onDiscoverPeripheral(peripheral);

		});

		// Set an event handler to wait until the noble starts up
		noble.on('stateChange', (state) => {

			console.log(`noble state has been changed: ${state}`);

			if (state !== 'poweredOn') {
				return;
			}

			// Start scan the peripherals (sensor devices)
			// NOTE: When the peripheral is discovered, onDiscoverPeripheral method will be called.
			noble.startScanning([], true);

		});

	}


	/**
	 * Stop scanning of peripherals that matched with registered monitoring devices
	 * @private
	 * @return {Promise}
	 */
	stopScanner () {

		console.log('stopScanner');

		if (this.scannerTimer) {
			clearTimeout(this.scannerTimer);
		}

		noble.stopScanning();

	}


	/**
	 * Start scanning of peripherals that matched with registered monitoring devices
	 * @private
	 * @return {Promise}
	 */
	restartScanner () {

		console.log('restartScanner');

		if (this.scannerTimer) {
			clearTimeout(this.scannerTimer);
		}

		this.scannerTimer = setTimeout(() => {

			this.scannerTimer = null;

			// Re-start scanning of the peripherals (sensor devices)
			noble.startScanning([], true);

		}, 1000);

	}


	/**
	 * An event handler that will be called when the peripheral is discovered
	 * @private
	 * @param  {Peripheral}  peripheral A peripheral object of a device
	 * @return {Promise}
	 */
	onDiscoverPeripheral (peripheral) {

		const address = peripheral.uuid;

		// Check for whether the device is registered for monitoring
		if (!(address in this.devices)) { // unregistered
			// TODO: console.log(`An unknown peripheral was discovered ${peripheral.uuid}`);
			return;
		}

		// Check for whether the device is already conneting
		if (this.devices[address].peripheral) {
			return;
		}

		// Stop the scanning
		this.stopScanner();

		// Connect to the device
		console.log(`Connecting to peripheral... ${peripheral.uuid}`);
		peripheral.connect((err_0) => {

			if (err_0) {

				// Re-start scanning of the peripherals (sensor devices)
				this.restartScanner();

				// Done
				console.error(err_0);
				return;

			}

			console.log(`Connected to peripheral ${peripheral.uuid}`);

			// Set an event handler
			peripheral.once('disconnect', () => {

				console.log(`Disconnected from peripheral ${peripheral.uuid}`);

				// Remove the peripheral object from devices list
				this.devices[address].peripheral = null;
				this.devices[address].subscribing = false;

				// Show the devices
				this.printCurrentDevices();

				// Re-start scanning of the peripherals (sensor devices)
				this.restartScanner();

			});

			// Add the peripheral object to devices list
			this.devices[address].peripheral = peripheral;

			// Show the devices
			this.printCurrentDevices();

			// Get the service and the characteristic from the peripheral
			console.log(`Finding characteristic on ${address}...`);
			peripheral.discoverSomeServicesAndCharacteristics(
				[this.SENSOR_SERVICE_UUID],
				[this.SENSOR_CHARACTERISTIC_UUID],
				(err_1, services, characteristics) => {

					if (err_1) {

						console.error(err_1);

						// Re-start scanning of the peripherals (sensor devices)
						this.restartScanner();

						// Done
						return;

					}

					// Subscribe the characteristic
					console.log(`Characteristic was found on ${address}`);
					this.subscribeCharacteristic(address, characteristics[0]);

					// Re-start scanning of the peripherals (sensor devices)
					this.restartScanner();

				}
			);

		});

	}


	/**
	 * An event handler that will be called when the sensor status is changed
	 * @private
	 * @param  {String}  address An address of the sensor device
	 * @param  {String}  data An sensor data of the sensor device
	 * @return {Promise}
	 */
	onSensorStatusChanged (address, data) {

		const status = data.readUInt8(0);

		// Save the sensor status as latest sensor status
		if (status === 0) {
			this.devices[address].sensorStatus = 'OPEN';
			console.log(`Status of ${address} has been changed to OPEN`);
		} else if (status === 1) {
			this.devices[address].sensorStatus = 'CLOSE';
			console.log(`Status of ${address} has been changed to CLOSE`);
		} else {
			console.log(`Status of ${address} has been changed to UNKNOWN (${status})`);
		}

		// Call the listener
		try {
			if (this.onSensorStatusChangedListener) {
				this.onSensorStatusChangedListener(address, this.devices[address].sensorStatus);
			}
		} catch (e) {
			return;
		}

	}


	/**
	 * Subscribe the characteristic
	 * @private
	 * @param  {String} address Address of the sensor device
	 * @param  {Characteristic} characteristic A characteristic of service
	 */
	async subscribeCharacteristic (address, characteristic) {

		return new Promise((resolve, reject) => {

			characteristic.on('data', (data, is_notification) => { // On the sensor status has been changed

				this.onSensorStatusChanged(address, data);

			});

			// To enable notify of service
			characteristic.subscribe((error) => {

				console.log(`Subscribing of sensor has been started ${address}`);
				this.devices[address].subscribing = true;

				// For debugging
				this.printCurrentDevices();

				// Done
				return resolve();

			});

		});

	}

}


module.exports = MagMonitor;
