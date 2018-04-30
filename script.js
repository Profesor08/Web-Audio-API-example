let sourceFile = "xmas.evs-loop.mp3";
let context = new AudioContext();

let source = context.createBufferSource();
source.loop = true;

// Create stereo panner to make stere effects to work
let stereo = context.createStereoPanner();
source.connect(stereo);

// Creating filter
let biquadFilter = context.createBiquadFilter();
biquadFilter.type = "lowpass";
stereo.connect(biquadFilter);
biquadFilter.frequency.setValueAtTime(4000, context.currentTime);
biquadFilter.gain.setValueAtTime(0, context.currentTime);

// Stereo panner is connected to source to add stere effects like, then filter is connected to stere panner, to add some effects, it works like a pipe;

// Finaly connecting pipe to output
biquadFilter.connect(context.destination);

// Creating analyser to have acces to current frequency data, it will be used to draw something on canvas
let analyser = context.createAnalyser();
analyser.fftSize = 2048;    
biquadFilter.connect(analyser);
let bufferLength = analyser.frequencyBinCount;
let frequencyData = new Uint8Array(bufferLength);

// for some graphics
let canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
let ctx = canvas.getContext("2d");

// There is loading audio source file 'sourceFile'
fetch(sourceFile).then(function(response) {
  // getting arraybuffer from response. it is required for decoding audio data
  response.arrayBuffer().then(function(buffer) {
    // decoding audio data from audio buffer (it is arraybuffer)
    context.decodeAudioData(buffer, function(decodedData) {
      // adding decoded data to source buffer and starting to play audio
      source.buffer = decodedData;
      source.start(0);
    });
  });
});

// Done.

// Next code is an example to show how to make some dinamic effects while cursor is moving


// Some Math
function map(value, start1, stop1, start2, stop2) {
  return (value - start1) / (stop1 - start1) * (stop2 - start2) + start2;
}

function constrain(n, low, high) {
  return Math.max(Math.min(n, high), low);
}

function hypot(a, b) {
  return Math.sqrt(a * a + b * b);
}

function radius(a, b) {
  return hypot(a, b) / 2;
}

// defaults

let mx = window.innerWidth / 2;
let my = window.innerHeight / 2;
let pan = 0;
let frequency = 4000;

document.addEventListener("mousemove", function(e) {
  mx = e.clientX;
  my = e.clientY;
});

window.addEventListener("resize", function(e) {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
});

function stereAnimation() {
  let panValue = map(mx, 0, window.innerWidth, -1, 1);
  
  pan += (panValue - pan) * 0.1;
  
  stereo.pan.setValueAtTime(constrain(pan, -1, 1), context.currentTime);
}

function frequencyAnimation() {
  let r = 0;
  let r2 = 0;
  
  if (window.innerWidth < window.innerHeight) {
    r = window.innerWidth / 2;
    let d =  (window.innerHeight - window.innerWidth) / 2;
    r2 = Math.floor(radius(Math.abs(r - mx), Math.abs(r - my + d)));
  }
  else {
    r = window.innerHeight / 2;
    let d =  (window.innerWidth - window.innerHeight) / 2;
    r2 = Math.floor(radius(Math.abs(r - mx + d), Math.abs(r - my)));
  }
  
  let frequencyValue = map(constrain(r2 * 2, 0, r), 0, r, 
    4000, 146);
  
  frequency += (frequencyValue - frequency) * 0.1;
  
  biquadFilter.frequency.setValueAtTime(frequency, context.currentTime);
}

function audioVisualization() {
  analyser.getByteFrequencyData(frequencyData);

  ctx.fillStyle = "rgb(35, 36, 37)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let lineWidth = canvas.width / 256;
  
  for (let i = 0; i < 256; i++) {
    ctx.fillStyle = `rgb(255, 0, ${i})`;
    ctx.fillRect(i * lineWidth, canvas.height, 1, -frequencyData[i]);
  }
}

function ticker() {
  requestAnimationFrame(ticker);
  
  stereAnimation();
  frequencyAnimation();
  audioVisualization();
};

ticker();