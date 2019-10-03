window.addEventListener('deviceorientation', onDeviceOrientation, true);
window.addEventListener('devicemotion', onDeviceMotion, true);

function onDeviceOrientation(e) {
  console.log('onDeviceOrientation', e);
  const {alpha, beta, gamma, absolute} = e;
  const orientation = {alpha, beta, gamma, absolute};
  document.querySelector('#device-motion').innerHTML = JSON.stringify(orientation);
}

function onDeviceMotion(e) {
  console.log('onDeviceMotion', e);
  const {alpha, beta, gamma} = e.rotationRate;
  const motion = {alpha, beta, gamma};
  document.querySelector('#device-motion').innerHTML = JSON.stringify(motion);
}
