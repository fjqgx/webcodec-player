import { AudioContextPlayer, AudioInfo } from "../player/audiocontext-player";
import { AudioFormatType } from "../utils/audio-format-util";



export abstract class Decoder {

  protected player: AudioContextPlayer;

  protected audioFormatType: AudioFormatType = AudioFormatType.Unknown;

  protected audioDecoder?: AudioDecoder;

  protected flushTimer: number = 0;

  protected audioDataArr: AudioData[] = [];

  protected bufferArray: ArrayBuffer[] = [];


  constructor () {
    this.player = new AudioContextPlayer();
  }

  get duration (): number {
    return this.player.duration;
  }

  get currentTime (): number {
    return this.player.currentTime;
  }

  set volume(value: number) {
    this.player.volume = value;
  }

  get volume (): number {
    return this.player.volume;
  }

  set muted (value: boolean) {
    this.player.muted = value;
  }

  get muted (): boolean {
    return this.player.muted;
  }

  get paused (): boolean {
    return this.player.paused;
  }

  public pause (): boolean {
    return this.player.pause();
  }

  public resume (): Promise<void> {
    return this.player.resume();
  }

  public seek (value: number): boolean {
    return this.player.seek(value);
  }

  public abstract play (type: AudioFormatType): Promise<void>;

  public appendBuffer (buffer: ArrayBuffer): void {
    this.bufferArray.push(buffer);
  }

  protected init (config: AudioDecoderConfig): void {
    this.audioDecoder = new AudioDecoder({
      output: (frame: AudioData): void => {
        this.audioDataArr.push(frame);
      },
      error: (error: Error): void => {
        console.log("err:", error);
      }
    })
    this.audioDecoder.configure(config);
  }

  protected startFlushTimer (restart: boolean): void {
    if (restart) {
      this.stopFlushTimer();
    } else if (this.flushTimer !== 0) {
      return;
    }
    this.flushTimer = window.setInterval(() => {
      this.onFlushTimer();
    }, 200);
  }

  protected stopFlushTimer (): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = 0;
    }
  }

  protected onFlushTimer (): void {

  }
}