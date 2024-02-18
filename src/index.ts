import { WebCodecAudioPlayer } from "./audio";



declare global {
  interface Window {
    WebcodecAudioPlayer: any;
    AudioContext: any;
    webkitAudioContext: any;
  }
  
}

if (window) {
  window.WebcodecAudioPlayer = WebCodecAudioPlayer;
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
}

export { WebCodecAudioPlayer };
