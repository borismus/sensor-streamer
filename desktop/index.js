import '../common/firebase.js';

let channel;

function onLoad() {
  const searchParams = new URLSearchParams(location.search);
  channel = searchParams.get('channel');

  // Listen for data coming in on this channel.
  const path = `channel/${channel}`;
  firebase.database().ref(path).on('child_added', snap => onSensorData(snap.val()));
}

function onSensorData(sensorData) {
}

window.addEventListener('load', onLoad);
