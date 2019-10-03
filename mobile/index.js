window.addEventListener('deviceorientation', deviceOrientationListener, true);
window.addEventListener('devicemotion', deviceMotionListener, true);

function onDeviceOrientation(e) {
  console.log('onDeviceOrientation', e);
}

function onDeviceMotion(e) {
  console.log('onDeviceMotion', e);
}
