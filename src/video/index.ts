import { Player } from "../interface";

export class WebCodecPlayer extends Player {

  constructor () {
    super();
  }

  public pause (): boolean {
    return false;
  }

  get paused (): boolean {
    return false;
  }

  public resume (): Promise<void> {
    return new Promise((resolve, reject) => {

    })
  }

  public seek (value: number): boolean {
    return false;
  }


  public play (buffer: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      
    })
  }
}