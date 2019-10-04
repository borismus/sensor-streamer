import '../firebase';

let channel;

function onLoad() {
  const searchParams = new URLSearchParams(location.search);
  channel = searchParams.get('channel');

  window.addEventListener('deviceorientation', onDeviceOrientation, true);
  window.addEventListener('devicemotion', onDeviceMotion, true);
}

function onDeviceOrientation(e) {
  console.log('onDeviceOrientation', e);
  const {alpha, beta, gamma, absolute} = e;
  const timestamp = performance.now();
  const orientation = {alpha, beta, gamma, absolute, timestamp};
  document.querySelector('#device-motion').innerHTML = JSON.stringify(orientation);

  const path = `channel/${channel}`;
  firebase.database().ref(path).push(orientation);
}

function onDeviceMotion(e) {
  console.log('onDeviceMotion', e);
  const {alpha, beta, gamma} = e.rotationRate;
  const motion = {alpha, beta, gamma};
  document.querySelector('#device-motion').innerHTML = JSON.stringify(motion);
}

window.addEventListener('load', onLoad);
