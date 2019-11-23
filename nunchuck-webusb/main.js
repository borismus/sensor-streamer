import {serial} from './serial.js';
import {SensorRecorder} from './SensorRecorder.js';

window.addEventListener('load', onLoad);
let port;
const status = document.querySelector('#status');
const connectButton = document.querySelector('#connect');
const buttonC = document.querySelector('#button-c');
const buttonZ = document.querySelector('#button-z');
const motionNameInput = document.querySelector('#motion-name');
const saveButton = document.querySelector('#save');
const connectedSection = document.querySelector('#connected');
const disconnectedSection = document.querySelector('#disconnected');
const canvas = document.querySelector('#sensor-plot');

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
  window.addEventListener('resize', resizeCanvas, false);
  resizeCanvas();
  connectButton.addEventListener('click', startConnecting);
  saveButton.addEventListener('click', saveLastSecond);
  status.innerText = 'Loaded page.';
  showLinePlot();

  setInterval(() => {
    const hz = estimateFrequency();
    if (hz) {
      console.info(`Estimated sensor sample rate: ${hz} Hz.`);
    }
  }, 1000);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  console.log(`resizeCanvas: ${canvas.width} x ${canvas.height}.`);
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
    connectedSection.style.display = 'block';
    disconnectedSection.style.display = 'none';
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
      x: values[3],
      y: values[4],
      z: values[5],
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
  //saveLastSecond();
}

function onButtonReleased(button) {
  console.log(`onButtonReleased: ${button}`);
}

function onButtonHeld(button, data) {
}

function isFull(frame) {
  const values = frame.split(',');
  const last = values[values.length - 1];
  return values.length === FIELD_COUNT && last != '';
}

function showLinePlot() {
  const smoothie = new SmoothieChart({
    grid: { strokeStyle:'rgb(125, 0, 0)', fillStyle:'rgb(60, 0, 0)',
      lineWidth: 1, millisPerLine: 1000, verticalSections: 20, },
  });
  smoothie.streamTo(document.querySelector('#sensor-plot'), 1000);
  for (let [i, ts] of timeSeries.entries()) {
    const ind = i % TIMESERIES_STYLES.length;
    smoothie.addTimeSeries(ts, TIMESERIES_STYLES[ind]);
  }
}

function getRecentHistory(duration) {
  const last = history[history.length - 1];
  const out = [];
  // Find a value in history that's about a second in the past.
  for (let i = history.length - 1; i >= 0; i--) {
    const item = history[i];
    // Argh, every time I call splice, I have to look up its syntax.
    out.splice(0, 0, item);
    const ts = item.timestamp;
    if (last.timestamp - ts > duration) {
      break;
    }
    if (i === 0) {
      console.warn(`getRecentHistory does not have ${duration} seconds worth of data.`);
    }
  }
  return out;
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

function saveLastSecond() {
  const motionName = motionNameInput.value;
  if (!motionName) {
    status.innerText = 'Motion name required.';
    return;
  }
  // Save the last 1000ms worth of data.
  recorder.start(motionName);
  const recentHistory = getRecentHistory(1);
  for (let item of recentHistory) {
    const save = Object.assign({}, item.accelerometer);
    save.ts = item.timestamp;
    recorder.addData(save);
  }
  recorder.stop();
  status.innerText = `Saved "${recorder.exampleName}": ${recentHistory.length} samples to motion named ${motionName}.`;
}
