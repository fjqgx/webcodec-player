
/**
 * 播放器基类
 * AudioPlayer和VideoPlayer都继承这个基类
 */
export abstract class Player {

  abstract get paused (): boolean;

  public abstract pause (): boolean;

  public abstract resume (): Promise<void>;

  public abstract seek (value: number): boolean;

  public abstract play (buffer: ArrayBuffer): Promise<void>;

}