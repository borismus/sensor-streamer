import '../firebase';

let channel;

function onLoad() {
  const searchParams = new URLSearchParams(location.search);
  channel = searchParams.get('channel');

  // Listen for data coming in on this channel.
}

window.addEventListener('load', onLoad);
