window.addEventListener('deviceorientation', onDeviceOrientation, true);
window.addEventListener('devicemotion', onDeviceMotion, true);

function onDeviceOrientation(e) {
  console.log('onDeviceOrientation', e);
}

function onDeviceMotion(e) {
  console.log('onDeviceMotion', e);
}
