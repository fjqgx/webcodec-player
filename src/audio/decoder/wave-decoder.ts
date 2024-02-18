
import { AudioFormatType } from "../utils/audio-format-util";
import { Decoder } from "./decoder";


export class WaveDecoder extends Decoder {

  constructor () {
    super();
  }

  public play(type: AudioFormatType): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.bufferArray.length) {
        this.audioFormatType = type;
        const buffer: ArrayBuffer | undefined = this.bufferArray.shift();
        if (buffer) {
          this.player.play(buffer).then(() => {
            resolve();
          }).catch((err) => {
            reject(err);
          })
        }
      }
    })
  }
}