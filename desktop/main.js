import '../common/firebase.js';
import {generateName} from '../common/name-generator.js';

let channel;
let isConnected = false;
const timeSeries = [
  new TimeSeries(),
  new TimeSeries(),
  new TimeSeries(),
];

const TIMESERIES_STYLES = [
  { strokeStyle:'rgb(0, 255, 0)', fillStyle:'rgba(0, 255, 0, 0.4)', lineWidth:1 },
  { strokeStyle:'rgb(255, 0, 255)', fillStyle:'rgba(255, 0, 255, 0.3)', lineWidth:1 },
  { strokeStyle:'rgb(0, 0, 255)', fillStyle:'rgba(0, 0, 255, 0.3)', lineWidth:1 },
]

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
  firebase.database().ref(path).on('child_added', snap => onSensorDatum(snap.val()));

  // Show a QR code to start.
  showQRCode(getSensorSenderUrl());
  showLinePlot();
}

function getSensorSenderUrl() {
  let url = window.location.href;
  url = url.replace('desktop', 'mobile');
  url = url.replace('http://localhost:8000', 'https://borismus.github.io/sensor-streamer');
  return url;
}

function onSensorDatum(sensorDatum) {
  document.querySelector('#sensor-data').innerHTML = JSON.stringify(sensorDatum);
  timeSeries[0].append(sensorDatum.timestamp, sensorDatum.alpha);
  timeSeries[1].append(sensorDatum.timestamp, sensorDatum.beta);
  timeSeries[2].append(sensorDatum.timestamp, sensorDatum.gamma);
}

function showLinePlot() {
  const smoothie = new SmoothieChart({
    grid: { strokeStyle:'rgb(125, 0, 0)', fillStyle:'rgb(60, 0, 0)',
      lineWidth: 1, millisPerLine: 500, verticalSections: 6, },
    labels: { fillStyle:'rgb(60, 0, 0)' }
  });
  smoothie.streamTo(document.querySelector('#sensor-plot'), 1000);
  for (let [i, ts] of timeSeries.entries()) {
    smoothie.addTimeSeries(ts, TIMESERIES_STYLES[i]);
  }
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
