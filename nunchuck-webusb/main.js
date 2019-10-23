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

const FIELD_COUNT = 8;

const timeSeries = [];
for (let i = 0; i < FIELD_COUNT; i++) {
  timeSeries.push(new TimeSeries());
}

let buffer = '';
let history = [];

function onLoad() {
  connectButton.addEventListener('click', startConnecting);
  status.innerText = 'onLoad';
  showLinePlot();

  setInterval(() => {
    const hz = estimateFrequency();
    if (hz) {
      console.info(`Estimated sensor sample rate: ${hz} Hz.`);
    }
  }, 1000);
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
    // Store timestamp in seconds.
    timestamp: values[0] / 1000,
    joystick: {
      x: values[1],
      y: values[2],
    },
    accelerometer: {
      alpha: values[3],
      beta: values[4],
      gamma: values[5],
    },
    z: values[6],
    c: values[7],
  }
  const now = Date.now();
  const prevData = history[history.length - 1];
  history.push(data);
  for (let i = 1; i < 6; i++) {
    const value = values[i];
    timeSeries[i].append(now, value);
  }

  // Show button presses.
  buttonC.classList.toggle('pressed', !!data.c);
  buttonZ.classList.toggle('pressed', !!data.z);

  const buttons = ['c', 'z'];

  for (const button of buttons) {
    // Make holding down the Z button save the accelerometer data to the database.
    if (prevData && !prevData[button] && data[button]) {
      // We just pressed down the Z button.
      onButtonPressed(button);
    }
    if (prevData && prevData[button] && !data[button]) {
      onButtonReleased(button);
    }
    if (data[button]) {
      onButtonHeld(button, data);
    }
  }
}

function onButtonPressed(button) {
  console.log(`onButtonPressed: ${button}`);
  recorder.start(button);

  console.log(`Saving data to ${recorder.channel}.`);
}

function onButtonReleased(button) {
  console.log(`onButtonReleased: ${button}`);
  recorder.stop();
}

function onButtonHeld(button, data) {
  const sensorData = Object.assign({}, data.accelerometer);
  sensorData.timestamp = data.timestamp;
  recorder.addData(data);
}

function isFull(frame) {
  const values = frame.split(',');
  const last = values[values.length - 1];
  return values.length === FIELD_COUNT && last != '';
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

function estimateFrequency() {
  const last = history[history.length - 1];
  let first;
  let firstIndex;
  // Find a value in history that's about a second in the past.
  for (let i = history.length - 1; i >= 0; i--) {
    const item = history[i];
    const ts = item.timestamp;
    if (last.timestamp - ts > 1) {
      first = item;
      firstIndex = i;
      break;
    }
  }
  // If history is too small, no point in estimating frequency.
  if (!first) {
    return null;
  }

  const duration = last.timestamp - first.timestamp;
  const count = history.length - firstIndex;

  // Frequency is number of samples per second.
  return count / duration;
}
