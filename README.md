# homebridge-iam-voc

A [HomeBridge Plugin](https://github.com/nfarina) making the [Applied Sensors iAM USB](http://ams.com/eng/Products/Environmental-Sensors/Air-Quality-Sensors/iAM) air quality sensor availible in homekit [HomeKit](https://developer.apple.com/homekit/).

## Installation

For use on an Ubuntu/Debian style Linux: 

```
sudo apt-get install build-essential libudev-dev
sudo npm install -g --unsafe-perm homebridge-aircontrol-mini
```

To allow homebridge to run without beeing root or using sudo a udev Rule needs to be added. 

Create `/etc/udev/rules.d/23-homebridge.rules` and put in the following line, where you replace `homebridge` with the group of the user running homebridge on your system (e.g. `pi` on a raspian):

```
SUBSYSTEM=="usb", ATTR{idVendor}=="04d9", ATTR{idProduct}=="a052", GROUP="homebridge", MODE="0664"
```

Afterwards reload the rules with `udevadm control --reload` and replug the USB plug of your AirControl Mini.

## Sample Config (Excerpt)

Configured as part of your homebridge configuration.

- `name`: Required, String; You need to configure the `name` of your accessory. 

In addition to this you need to connect the device to your machine running homebridge. 

```
{
  "bridge": {
    …
  },
  …
  "accessories": [
    {
      "accessory": "iam-voc",
      "name": "Living Room Air Quality"
    }
  ],
	…
}

```
