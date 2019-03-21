var Service, Characteristic;

const iAMVOCMonitor = require("iam-voc-monitor");
const moment = require("moment");
const util = require("util");

module.exports = function(homebridge) {
  FakeGatoHistoryService = require('fakegato-history')(homebridge);
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory(
    "homebridge-iam-voc",
    "iam-voc",
    iAMVOCAccessory
  );
};

function iAMVOCAccessory(log, config) {
  var that = this;

  this.log = log;
  this.name = config["name"];
  this.displayName = this.name; // Expected by Fakegato
  this.lastAdded = moment();
  var CustomCharacteristic = {};

  // Set up VOC
  this.vocMonitor = new iAMVOCMonitor();
  this.airQualityService = new Service.AirQualitySensor(this.name);

  // Set up information service
  this.informationService = new Service.AccessoryInformation();
  this.informationService.setCharacteristic(
    Characteristic.Manufacturer,
    "Applied Sensors"
  );
  this.informationService.setCharacteristic(
    Characteristic.Model,
		"iAM USB Air Quality Sensor"
  );

  // Eve Room PPM Characteristic
  CustomCharacteristic.EveAirQuality = function () {
    Characteristic.call(this, 'Eve Air Quality', 'E863F10B-079E-48FF-8F27-9C2605A29F52');
       this.setProps({
                 format: Characteristic.Formats.FLOAT,
                 unit: "ppm",
                 maxValue: 5000,
                 minValue: 0,
                 minStep: 1,
                 perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
       });
  };
  CustomCharacteristic.EveAirQuality.UUID = 'E863F10B-079E-48FF-8F27-9C2605A29F52';
  util.inherits(CustomCharacteristic.EveAirQuality, Characteristic);
  this.airQualityService.addCharacteristic(CustomCharacteristic.EveAirQuality);

  // Setup Fakegato
  this.loggingService = new FakeGatoHistoryService("room", this, { storage: 'fs' });

  // Start transfer
  this.vocMonitor.on("connected", device => {

		this.vocMonitor.startTransfer();
		this.airQualityService.setCharacteristic(
			Characteristic.StatusActive,
			true
		);
  });

  this.vocMonitor.on("rawData", voc => {		
		let normalizedVoc = (voc - 450.0) / 1550.0;
		let quality = Characteristic.AirQuality.UNKNOWN;
		
		if (normalizedVoc <= 0.2) {
			quality = Characteristic.AirQuality.EXCELLENT;
		}
		else if (normalizedVoc <= 0.4) {
			quality = Characteristic.AirQuality.GOOD;
		} 
		else if (normalizedVoc <= 0.6) {
			quality = Characteristic.AirQuality.FAIR;
		}
		else if (normalizedVoc <= 0.8) {
			quality = Characteristic.AirQuality.INFERIOR;
		}		
		else {
			quality = Characteristic.AirQuality.POOR;
		}
		
		if (this.quality != quality) {
			this.quality = quality;
			this.airQualityService.setCharacteristic(
				Characteristic.AirQuality,
				quality
			);
			
			this.log("VOC air quality changed. Now at", voc, "ppm. Normalized:", normalizedVoc);
		}
    // Throttle history to one data point per 20s
    if (moment().diff(this.lastAdded, 'seconds') > 20) {
	    this.loggingService.addEntry({time: moment().unix(), temp:0, humidity:0, ppm:voc});
      this.lastAdded = moment();
      this.airQualityService.setCharacteristic(
        CustomCharacteristic.EveAirQuality,
        voc);
    }
		let vocDensity = normalizedVoc * 1000.0;
		this.airQualityService.setCharacteristic(
			Characteristic.VOCDensity,
			vocDensity
    );
  });

	this.getServices.bind(this);
	
  this.vocMonitor.connect();
}

iAMVOCAccessory.prototype.getServices = function() {
  return [this.airQualityService, this.informationService, this.loggingService];
};
