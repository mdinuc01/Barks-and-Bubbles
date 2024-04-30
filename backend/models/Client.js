class Client {
  constructor(id = '', petParentName = '', contactMethod = '', animalType = '', breed = '', petName = '', serviceArea = '') {
    this.id = id;
    this.petParentName = petParentName;
    this.contactMethod = contactMethod;
    this.animalType = animalType;
    this.breed = breed;
    this.petName = petName;
    this.serviceArea = serviceArea;
  }



  // Method to display client information
  displayInfo() {
    console.log(`ID: ${this.id}`)
    console.log(`Pet Parent Name: ${this.petParentName}`);
    console.log(`Contact Method: ${this.contactMethod}`);
    console.log(`Animal Type: ${this.animalType}`);
    console.log(`Breed: ${this.breed}`);
    console.log(`Pet Name: ${this.petName}`);
    console.log(`Service Area: ${this.serviceArea}`);
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
    const { id, petParentName, contactMethod, animalType, breed, petName, serviceArea } = json;
    return new Client(id, petParentName, contactMethod, animalType, breed, petName, serviceArea);
  }
}

module.exports = Client;