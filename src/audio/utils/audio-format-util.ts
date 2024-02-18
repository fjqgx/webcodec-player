import { AacAdtsFormat } from "../format/aac-adts";
import { Mp3Format } from "../format/mp3";
import { OggOpusFormat } from "../format/opus";
import { WaveFormat } from "../format/wave";

/**
 * 音频格式
 */
export const enum AudioFormatType {
  // 未知的格式
  Unknown = 0,
  Wave,
  AacAdts,
  Mp3,
  Opus,
}

export class AudioFormatUtil {

  protected waveFormat: WaveFormat = new WaveFormat();

  protected aacAdtsFormat: AacAdtsFormat = new AacAdtsFormat();

  protected mp3Format: Mp3Format = new Mp3Format();

  protected opusFormat: OggOpusFormat = new OggOpusFormat();

  constructor () {

  }

  public checFormat (data: Uint8Array): AudioFormatType {
    let format: AudioFormatType = AudioFormatType.Unknown;
    if (this.waveFormat.check(data)) {
      console.log('wave')
      format = AudioFormatType.Wave;
    } else if (this.aacAdtsFormat.check(data)) {
      console.log("aac-adts");
      format = AudioFormatType.AacAdts;
    } else if (this.mp3Format.check(data)) {
      console.log("mp3");
      format = AudioFormatType.Mp3;
    } else if (this.opusFormat.check(data)) {
      format = AudioFormatType.Opus;
    }
    return format;
  }}