import '../common/firebase.js';

let channel;

function onLoad() {
  const searchParams = new URLSearchParams(location.search);
  channel = searchParams.get('channel');

  // Access to sensor data requires user action.
  document.querySelector('#start').addEventListener('click', onStart);
}

function onStart() {
  console.log('onStart');
  DeviceOrientationEvent.requestPermission();
  //window.addEventListener('deviceorientation', onDeviceOrientation, true);
  window.addEventListener('devicemotion', onDeviceMotion, true);
}

function onDeviceOrientation(e) {
  console.log('onDeviceOrientation', e);
  const {alpha, beta, gamma} = e;
  const timestamp = Date.now();
  const sensorData = {alpha, beta, gamma, timestamp};
  document.querySelector('#device-motion').innerHTML = JSON.stringify(sensorData);

  const path = `channel/${channel}`;
  firebase.database().ref(path).push(sensorData);
}

function onDeviceMotion(e) {
  console.log('onDeviceMotion', e);
  const {alpha, beta, gamma} = e.rotationRate;
  const timestamp = Date.now();
  const sensorData = {alpha, beta, gamma, timestamp};
  document.querySelector('#device-motion').innerHTML = JSON.stringify(sensorData);

  const path = `channel/${channel}`;
  firebase.database().ref(path).push(sensorData);
}

window.addEventListener('load', onLoad);
