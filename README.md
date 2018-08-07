# lmag-server

Unofficial WebAPI server for mag (door sensor)


----


## Notice

* This software is published under testing phase.
* This is unofficial software for the convenience of users.
* I don't any guarantee about this software.
* I don't have any relationship with the vendor company of the sensor product.


----


## Get Started

It tested on Raspberry Pi Zero W with Raspbian Stretch and Node v9.

```
$ sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev

$ npm install

$ sudo npm start
```

Now, you can get a sensor status with using `GET` request to WebAPI:
`http://localhost:3000/xx:xx:xx:xx:xx:xx`
(NOTE: `xx:xx:xx:xx:xx:xx` is a device address of your mag.)

The following JSON is an example of a response from WebAPI.
The status value can be "OPEN", "CLOSE" or "UNKNOWN".
```
{
	"status": "CLOSE"
}
```


----


## WebAPI Document

 #TODO


----


## License

```
The MIT License (MIT)
Copyright (c) 2018 Masanori Ohgita
```
