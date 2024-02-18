
import { AudioFormatType, AudioFormatUtil } from "./utils/audio-format-util"
import { Decoder } from "./decoder/decoder";
import { WaveDecoder } from "./decoder/wave-decoder";
import { Player } from "../interface";
import { WebcodecAudioDecoder } from "./decoder/audio-decoder";

export const enum PlayerState {
  /** 播放完成或者还没有播放 */
  Stop,
  Loading,
  Suspended,
  Playing,
  Paused,
  Waiting,
}

export const enum WebCodecAudioPlayerEvent {

}

export class WebCodecAudioPlayer extends Player {

  // 播放器状态
  protected playerState: PlayerState = PlayerState.Stop;

  // 当前播放的音频格式
  protected currentAudioFormat: AudioFormatType = AudioFormatType.Unknown;

  protected format_util: AudioFormatUtil = new AudioFormatUtil();

  protected player?: Decoder;

  constructor () {
    super();
  }

  /**
   * 获取当前音频的总长度
   */
  get duration (): number {
    return this.player ? this.player.duration : 0;
  }

  get currentTime (): number {
    return this.player ? this.player.currentTime : 0;
  }

  set volume(value: number) {
    if (this.player) {
      this.player.volume = value;
    }
  }

  get volume (): number {
    return this.player ? this.player.volume : 0;
  }

  set muted (value: boolean) {
    if (this.player) {
      this.player.muted = value;
    } 
  }

  get muted (): boolean {
    return this.player ? this.player.muted : false;
  }

  public pause (): boolean {
    if (this.player) {
      return this.player.pause();
    }
    return false;
  }

  get paused (): boolean {
    if (this.player) {
      return this.player.paused;
    }
    return false;
  }

  public resume (): Promise<void> {
    if (this.player) {
      return this.player.resume();
    } else {
      return Promise.reject({
        code: -1,
        message: "no player"
      }); 
    }
  }

  public seek (value: number): boolean {
    if (this.player) {
      return this.player.seek(value);
    } else {
      return false;
    }
  }

  public appendBuffer (buffer: ArrayBuffer): boolean {
    if (this.player) {
      this.player.appendBuffer(buffer);
      return true;
    }
    return false;
  }

  public play (buffer: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      this.playerState = PlayerState.Loading;
      let data: Uint8Array = new Uint8Array(buffer);
      let type: AudioFormatType = this.format_util.checFormat(data);
      switch (type) {
        case AudioFormatType.Wave:
        case AudioFormatType.Mp3:
          this.player = new WaveDecoder();
          this.player.appendBuffer(buffer);
          this.player.play(type).then(() => {
            this.playerState = PlayerState.Playing;
            resolve();
          }).catch((err) => {
            reject(err);
          })
          break;
        
        case AudioFormatType.AacAdts:
        case AudioFormatType.Opus:
          this.player = new WebcodecAudioDecoder();
          this.player.appendBuffer(buffer);
          this.player.play(type).then(() => {
            this.playerState = PlayerState.Playing;
            resolve();
          }).catch((err) => {
            reject(err);
          })
          break;
        
        case AudioFormatType.Opus:
          
          break;
  
        default:
          reject({
            code: -1,
            message: "not support audio format"
          })
          break;
      }
    })
    
  }
}