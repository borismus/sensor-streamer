import {serial} from './serial.js';

window.addEventListener('load', onLoad);
let port;
const status = document.querySelector('#status');
const button = document.querySelector('#connect');



function onLoad() {
  button.addEventListener('click', startConnecting);
  status.innerText = 'onLoad';
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

let buffer = '';
let history = [];

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
  const values = frame.split(',');
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
  console.log('Data point', data);
  history.push(data);
}

function isFull(frame) {
  const count = frame.split(',').length;
  return count === 7;
}
