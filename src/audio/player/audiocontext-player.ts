import { EventEmitter } from "../../utils/event-emitter";


export interface AudioContextPlayerEvent {
  'AudioInfo': (info: AudioInfo) => void;
  'AudioEnd': () => void;
}

export interface AudioInfo {
  duration: number;
  sampleRate: number;
  channels: number;
}

/**
 * 音频播放器
 * 使用AudioContext播放声音
 */
export class AudioContextPlayer extends EventEmitter<AudioContextPlayerEvent> {

  protected audioMuted: boolean = false;

  protected audioVolume: number = 1;

  protected audioContext: AudioContext = new AudioContext();

  protected gainNode: GainNode = this.audioContext.createGain();

  protected audioSource?: AudioBufferSourceNode;

  protected playSuccessTimer: number = 0;

  protected audioInfo: AudioInfo = {
    duration: 0,
    sampleRate: 0,
    channels: 0,
  }

  constructor () {
    super();
    this.init();
  }

  get duration(): number {
    return this.audioInfo.duration;
  }

  get currentTime (): number {
    return this.audioContext.currentTime;
  }

  set volume(value: number) {
    if (undefined === value || Number.isNaN(value)) {
      return;
    }
    value = value < 0 ? 0 : value;
    value = value > 1 ? 1 : value;
    this.audioVolume = value;
    if (!this.audioMuted) {
      this.gainNode.gain.value = value;
    }
  }

  get volume (): number {
    return this.audioVolume;
  }

  set muted (value: boolean) {
    if (value !== this.audioMuted) {
      this.audioMuted = value;
      if (value) {
        this.gainNode.gain.value = 0;
      } else {
        this.gainNode.gain.value = this.audioVolume;
      }
    }
  }

  get muted (): boolean {
    return this.audioMuted;
  }

  get paused (): boolean {
    return this.audioContext.state === "suspended";
  }

  public pause (): boolean {
    switch (this.audioContext.state) {
      case 'running':
        this.audioContext.suspend();
        return true;

      case 'suspended':
        return true;

      default:
        return false;
    }
  }

  public resume (): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.audioContext.state === 'running') {
        resolve();
      } else if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
        this.checkPlaySuccess().then(() => {
          resolve();
        }).catch(() => {
          reject();
        })
      } else {
        reject({
          code: -1,
          message: 'player stopped'
        })
      }
    })
  }

  public seek (value: number): boolean {
    if (this.audioSource && value >= 0 && value <= this.audioInfo.duration) {
      this.audioSource.start(value);
    }
    return false;
  }

  /**
   * 开始播放
   * @param buffer 
   * @param needDecod 
   * @returns 
   */
  public play (buffer: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      this.audioContext.decodeAudioData(buffer).then((audioBuffer: AudioBuffer) => {
        this.audioInfo = {
          sampleRate: audioBuffer.sampleRate,
          channels: audioBuffer.numberOfChannels,
          duration: audioBuffer.duration,
        }
        this.emit("AudioInfo", this.audioInfo);
        this.excutePlay(audioBuffer);
        this.checkPlaySuccess().then(() => {
          resolve();
        }).catch(() => {
          reject();
        })
      }).catch((err) => {
        console.log("decode err:", err);
        reject({
          code: -3,
          message: "decode audio data error"
        })
      })
    })
  }

  protected init (): void {
    console.log("state change:", this.audioContext.state)
    this.audioContext.addEventListener("statechange", (event: Event) => {
      console.log("state change:", this.audioContext.state)
    })
  }

  protected excutePlay (audioBuffer: AudioBuffer): void {
    this.audioSource = this.audioContext.createBufferSource();

    this.audioSource.buffer = audioBuffer;

    this.audioSource.connect(this.gainNode);
    
    this.gainNode.connect(this.audioContext.destination);

    this.audioSource.start();

    this.audioSource.onended = (event: Event) => {
      this.emit("AudioEnd");
    }
  }

  private checkPlaySuccess (): Promise<void> {
    return new Promise((resolve, reject) => {
      if (0 === this.playSuccessTimer) {
        let index: number = 0;
        this.playSuccessTimer = window.setInterval(() => {
          ++index;

          if (this.audioContext.state === "running") {
            window.clearInterval(this.playSuccessTimer);
            this.playSuccessTimer = 0;
            resolve();
          } else if (3 === index) {
            window.clearInterval(this.playSuccessTimer);
            this.playSuccessTimer = 0;
            reject();
          }
        }, 100)
      }
    })
  }
  
}