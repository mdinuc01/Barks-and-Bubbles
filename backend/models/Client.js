const idUtil = require('../utils/idUtil.js');

class Client {
  constructor(petParentName = '', contactMethod = '', animalType = '', breed = '', petName = '', serviceArea = '') {
    this.id = idUtil.generateUniqueId("c");
    this.petParentName = petParentName;
    this.contactMethod = contactMethod;
    this.animalType = animalType;
    this.breed = breed;
    this.petName = petName;
    this.serviceArea = serviceArea;
  }

  // Getters and setters
  get petParentName() {
    return this._petParentName;
  }

  set petParentName(value) {
    this._petParentName = value;
  }

  toData() {
    return {
      id: this.id,
      petParentName: this.petParentName,
      contactMethod: this.contactMethod,
      animalType: this.animalType,
      breed: this.breed,
      petName: this.petName,
      serviceArea: this.serviceArea
    };
  }

  // Static method to create a client object from JSON
  static fromJSON(json) {
    const { petParentName, contactMethod, animalType, breed, petName, serviceArea } = json;
    return new Client(petParentName, contactMethod, animalType, breed, petName, serviceArea);
  }
}

module.exports = Client;