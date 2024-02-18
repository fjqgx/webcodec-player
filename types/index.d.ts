
export declare class WebCodecAudioPlayer {

  // 音频总长度，单位秒
  readonly duration: number;

  // 当前播放时间，单位秒
  readonly currentTime: number;

  // 设置音量
  set volume(value: number);

  // 获取音量
  get volume (): number;

  set muted (value: boolean);

  get muted (): boolean;

  get paused (): boolean;
  
  pause (): boolean;

  resume (): Promise<void>;

  seek (value: number): boolean;

  // 播放
  play (buffer: ArrayBuffer): Promise<void>;
}