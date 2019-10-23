import '../common/firebase.js';
import {generateName} from '../common/name-generator.js';

/** Recording sensor data to Firebase Realtime Database. */
export class SensorRecorder {
  constructor(tag) {
  }

  start(tag) {
    this.tag = tag;
    // Create a new firebase realtime database reference.
    this.channel = generateName();
  }

  addData(sensorData) {
    // Push a new datapoint.
    const path = `arduino-data/${this.tag}/${this.channel}`;
    firebase.database().ref(path).push(sensorData);
  }

  stop() {
    // Mark as complete.
  }
}
