import '../common/firebase.js';
import {generateName} from '../common/name-generator.js';

/** Recording sensor data to Firebase Realtime Database. */
export class SensorRecorder {
  constructor() {
  }

  start(motionName) {
    this.motionName = motionName;
    // Create a new firebase realtime database reference.
    this.exampleName = generateName();
  }

  addData(sensorData) {
    // Push a new datapoint.
    const path = `arduino-data/${this.motionName}/${this.exampleName}`;
    firebase.database().ref(path).push(sensorData);
  }

  stop() {
    // Mark as complete.
  }
}
