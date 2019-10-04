import '../common/firebase.js';
import {generateName} from './name-generator.js';

let channel;
let isConnected = false;

function onLoad() {
  const searchParams = new URLSearchParams(location.search);
  channel = searchParams.get('channel');
  if (!channel) {
    channel = generateName();
    // Redirect.
    window.location.search = `?channel=${channel}`;
  }

  // Listen for data coming in on this channel.
  const path = `channel/${channel}`;
  firebase.database().ref(path).on('child_added', snap => onSensorData(snap.val()));

  // Show a QR code to start.
  showQRCode(getSensorSenderUrl());
}

function getSensorSenderUrl() {
  let url = window.location.href;
  url = url.replace('desktop', 'mobile');
  url = url.replace('http://localhost:8000', 'https://borismus.github.io/sensor-streamer');
  return url;
}

function onSensorData(sensorData) {
  document.querySelector('#sensor-data').innerHTML = JSON.stringify(sensorData);
}

function showQRCode(url) {
  const canvas = document.querySelector('#qr-code');
  QRCode.toCanvas(canvas, url, (error) => {
    if (error) {
      console.error(`QR Code error`);
    }
  });
}

function hideQRCode() {
  document.querySelector('#qr-code').innerHTML = '';
}

window.addEventListener('load', onLoad);
