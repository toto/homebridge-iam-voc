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
  this.informationService.setCharacteristic(
    Characteristic.Manufacturer,
    "Applied Sensors"
  );
  this.informationService.setCharacteristic(
    Characteristic.Model,
		"iAM USB Air Quality Sensor"
  );
	
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
  return [this.airQualityService, this.informationService];
};
