var Service, Characteristic;

const iAMVOCMonitor = require("iam-voc-monitor");


module.exports = function(homebridge) {
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


  // Set up VOC
  this.vocMonitor = new iAMVOCMonitor();
  this.airQualityService = new Service.AirQualitySensor(this.name);
	
	// Set up information service
  this.informationService = new Service.AccessoryInformation();
  this.vocMonitor.on("connected", device => {
	  this.informationService.setCharacteristic(
	    Characteristic.Manufacturer,
	    device.iManufacturer
	  );
	  this.informationService.setCharacteristic(
	    Characteristic.Model,
	    iProduct
	  );
	  this.informationService.setCharacteristic(
	    Characteristic.SerialNumber,
	    device.iSerialNumber
	  );
		
		this.vocMonitor.startTransfer();
  });

  this.vocMonitor.on("rawData", voc => {
    this.log(that.name, "VOC (ppm):", voc);
		
		let normalizedVoc = (voc - 450.0) / 1550.0;
		
		this.airQualityService.setCharacteristic(
			Characteristic.AirQuality,
			Characteristic.AirQuality.GOOD
		);
  });

	this.getServices.bind(this);
	
  this.vocMonitor.connect();
}


iAMVOCAccessory.prototype.getServices = function() {
  return [this.airQualityService, this.informationService];
};
