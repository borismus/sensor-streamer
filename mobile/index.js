window.addEventListener('deviceorientation', onDeviceOrientation, true);
window.addEventListener('devicemotion', onDeviceMotion, true);

function onDeviceOrientation(e) {
  console.log('onDeviceOrientation', e);
  document.querySelector('device-motion').innerHTML = JSON.stringify(e);
}

function onDeviceMotion(e) {
  console.log('onDeviceMotion', e);
  document.querySelector('device-motion').innerHTML = JSON.stringify(e.rotationRate);
}
