import {serial} from './serial.js';
import {SensorRecorder} from './SensorRecorder.js';

window.addEventListener('load', onLoad);
let port;
const status = document.querySelector('#status');
const connectButton = document.querySelector('#connect');
const buttonC = document.querySelector('#button-c');
const buttonZ = document.querySelector('#button-z');

const recorder = new SensorRecorder();

const TIMESERIES_STYLES = [
  { strokeStyle:'rgb(0, 255, 0)', fillStyle:'rgba(0, 255, 0, 0.3)', lineWidth:1 },
  { strokeStyle:'rgb(255, 0, 255)', fillStyle:'rgba(255, 0, 255, 0.3)', lineWidth:1 },
  { strokeStyle:'rgb(0, 0, 255)', fillStyle:'rgba(0, 0, 255, 0.3)', lineWidth:1 },
  { strokeStyle:'rgb(0, 255, 255)', fillStyle:'rgba(0, 255, 255, 0.3)', lineWidth:1 },
  { strokeStyle:'rgb(255, 255, 0)', fillStyle:'rgba(255, 255, 0, 0.3)', lineWidth:1 },
]

const timeSeries = [];
for (let i = 0; i < 7; i++) {
  timeSeries.push(new TimeSeries());
}

let buffer = '';
let history = [];

function onLoad() {
  connectButton.addEventListener('click', startConnecting);
  status.innerText = 'onLoad';
  showLinePlot();
}

async function startConnecting() {
  try {
    port = await serial.requestPort();
    connect(port);
  } catch (error) {
    status.innerText = `startConnecting error: ${error}`;
  }
}

async function connect(port) {
  try {
    await port.connect();
    const textDecoder = new TextDecoder();

    status.innerText = `Connected.`;
    port.onReceive = data => {
      processSensorData(textDecoder.decode(data));
    }
    port.onReceiveError = error => {
      console.error(error);
    };
  } catch (error) {
    status.innerText = `connect error: ${error}`;
  }
}

function processSensorData(data) {
  buffer += data;

  // Try to get all of the full frames out of the buffer.
  const lastChar = buffer[buffer.length - 1];
  const frames = buffer.split('\n');
  const lastFrame = frames[frames.length - 1];
  for (let frame of frames) {
    // Check if the frame is full.
    if (isFull(frame)) {
      processFrame(frame);
    }
  }
  buffer = lastFrame;
}

function processFrame(frame) {
  const values = frame.split(',').map(n => parseFloat(n));
  const data = {
    joystick: {
      x: values[0],
      y: values[1],
    },
    accelerometer: {
      alpha: values[2],
      beta: values[3],
      gamma: values[4],
    },
    z: values[5],
    c: values[6],
  }
  const prevData = history[history.length - 1];
  history.push(data);
  const now = Date.now();
  for (let i = 0; i < 5; i++) {
    const value = values[i];
    timeSeries[i].append(now, value);
  }

  // Show button presses.
  buttonC.classList.toggle('pressed', !!data.c);
  buttonZ.classList.toggle('pressed', !!data.z);

  // Make holding down the Z button save the accelerometer data to the database.
  if (prevData && !prevData.z && data.z) {
    // We just pressed down the Z button.
    onZPressed();
  }
  if (prevData && prevData.z && !data.z) {
    onZReleased();
  }
  if (data.z) {
    const sensorData = Object.assign({}, data.accelerometer);
    sensorData.timestamp = now;
    recorder.addData(sensorData);
  }
}

function onZPressed() {
  console.log('onZPressed');
  recorder.start();

  console.log(`Saving data to ${recorder.channel}.`);
}

function onZReleased() {
  console.log('onZReleased');
  recorder.stop();
}

function isFull(frame) {
  const values = frame.split(',');
  const last = values[values.length - 1];
  return values.length === 7 && last != '';
}

function showLinePlot() {
  const smoothie = new SmoothieChart({
    grid: { strokeStyle:'rgb(125, 0, 0)', fillStyle:'rgb(60, 0, 0)',
      lineWidth: 1, millisPerLine: 500, verticalSections: 20, },
  });
  smoothie.streamTo(document.querySelector('#sensor-plot'), 1000);
  for (let [i, ts] of timeSeries.entries()) {
    const ind = i % TIMESERIES_STYLES.length;
    smoothie.addTimeSeries(ts, TIMESERIES_STYLES[ind]);
  }
}
