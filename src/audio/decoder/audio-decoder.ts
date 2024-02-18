
import { AudioError } from "../error";
import { AacAdtsFormat, AdtsFixedHeader, AdtsFrame, AdtsProfile } from "../format/aac-adts";
import { OggOpusFormat, OpusPackage } from "../format/opus";
import { AudioFormatType } from "../utils/audio-format-util";
import { Decoder } from "./decoder";

/**
 * 音频采样率
 */
const SamplingFrequencyIndex: number[] = [
  96000,
  88200,
  64000,
  48000,
  44100,
  32000,
  24000,
  22050,
  16000,
  12000,
  11025,
  8000,
  7350,
  -1,
  1,
  -1
];

declare class MediaStreamTrackGenerator extends MediaStreamTrack {
  constructor (config: { kind: "audio" | "video"});

  readonly writable: WritableStream;
}

declare class WritableStream {
  getWriter(): WritableStreamDefaultWriter;
}

declare class WritableStreamDefaultWriter  {
  write(frame: AudioData): void;
}


export interface EncodedAudio {
  encoderInfo: AudioDecoderConfig;
  audioDataArr: Uint8Array[];
}

export class WebcodecAudioDecoder extends Decoder {

  protected aacAdtsFormat: AacAdtsFormat = new AacAdtsFormat();

  protected opusFormat: OggOpusFormat = new OggOpusFormat();

  protected writer: WritableStreamDefaultWriter;
  protected audioElement: HTMLAudioElement = document.createElement('audio');

  constructor () {
    super();
    const generator: MediaStreamTrackGenerator = new MediaStreamTrackGenerator({ kind: 'audio'});
    this.writer = generator.writable.getWriter();
    const mediaStream: MediaStream = new MediaStream();
    mediaStream.addTrack(generator);
    this.audioElement.srcObject = mediaStream;
  }
 
  public play(type: AudioFormatType): Promise<void> {
    return new Promise((resolve, reject) => {
      let buffer: Uint8Array | undefined = this.getFrame();
      if (buffer) {
        this.audioFormatType = type;
        this.decodeAudioFrame(buffer).then(() => {
          this.excutePlay().then(() => {
            resolve();
          }).catch((err) => {
            reject(err);
          })
        }).catch((err) => {
          reject(err);
        })
      }
    })
  }

  protected isSupport (data: AdtsFrame ): Promise<AudioDecoderSupport> {
    return new Promise((resolve, reject) => {
      if (window.AudioDecoder !== undefined) {
        let config: AudioDecoderConfig = this.createAudioDecoderConfig(data);
        AudioDecoder.isConfigSupported(config).then((res: AudioDecoderSupport) => {
          resolve(res);
        }).catch((err) => {
          // 参数异常
          reject({
            code: AudioError.AudioDecoder_Parameter_Abnormality,
            message: err.message
          });
        })
      } else {
        reject({
          code: AudioError.NotSupport_AudioDecoder,
          message: "not support AudioDecoder"
        })
      }
    })
  }

  protected excutePlay (): Promise<void> {
    return new Promise((resolve, reject) => {
      this.onFlushTimer();
      this.startFlushTimer(false);
      resolve();
    })
  }

  protected onFlushTimer(): void {
    if (this.audioDataArr.length) {
      while (this.audioDataArr.length) {
        const data: AudioData | undefined = this.audioDataArr.shift();
        if (data) {
          this.writer.write(data);
          console.log("have audio data ", this.audioElement.paused, "   ", this.audioElement.currentTime);
          if (this.audioElement.paused) {
            this.audioElement.play();
            console.log("audio play")
          }
        }
      }
    } else {
      let buffer: Uint8Array | undefined = this.getFrame();
      if (buffer) {
        this.decodeAudioFrame(buffer);
      }
    }
  }

  protected getFrame (): Uint8Array | undefined {
    if (this.bufferArray.length) {
      const buffer: ArrayBuffer | undefined = this.bufferArray.shift();
      if (buffer) {
        return new Uint8Array(buffer);
      }
    }
    return undefined;
  }

  protected decodeAudioFrame (buffer: Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
      let frameArr: AdtsFrame[] = [];
      switch (this.audioFormatType) {
        case AudioFormatType.AacAdts:
          frameArr = this.aacAdtsFormat.parse(buffer);
          break;
        
        case AudioFormatType.Opus:
          // frameArr = this.opusFormat.parse(buffer);
          break;

        default:
          break;
      }
      if (frameArr.length > 0) {
        this.isSupport(frameArr[0]).then((res: AudioDecoderSupport) => {
          console.log("supported")
          if (res.supported) {
            this.init(res.config);
            for (let i = 0; i < frameArr.length; ++i) {
              this.audioDecoder?.decode(new EncodedAudioChunk({
                data: frameArr[i].data,
                timestamp: 0,
                type: "key",
              }))
            }
            resolve();
          } else {
            reject({
              code: AudioError.AudioDecoder_Decoder_NotSupport,
              message: "codec not support"
            })
          }
        }).catch((err) => {
          console.log("not supported")
          reject(err);
        })
      } else {
        reject({
          code: -1,
          message: "audio data error, not aac-adts"
        })
      }
    })
  }

  private createAudioDecoderConfig (frame: AdtsFrame | OpusPackage): AudioDecoderConfig { //AdtsFixedHeader
    switch (this.audioFormatType) {
      case AudioFormatType.AacAdts:
        return this.createAacAdtsDecoderConfig(frame as AdtsFrame);

      case AudioFormatType.Opus:
        return this.createOpusDecoderConfig(frame as OpusPackage);

      default:
        break;
    }
    return {
      codec: '',
      numberOfChannels: 2,
      sampleRate: 0
    }
  }

  private createAacAdtsDecoderConfig (frame: AdtsFrame): AudioDecoderConfig {
    let config : AudioDecoderConfig = {
      codec: '',
      // description?: AllowSharedBufferSource | undefined;
      numberOfChannels: frame.header.channel_configuration,
      sampleRate: 0,
    }
    if (SamplingFrequencyIndex.length > frame.header.sampling_frequency_index) {
      config.sampleRate = SamplingFrequencyIndex[frame.header.sampling_frequency_index];
    }
    if (frame.header.profile === AdtsProfile.LowComplexity) {
      config.codec = 'mp4a.40.2';
    }
    return config;
  }

  private createOpusDecoderConfig (frame: OpusPackage): AudioDecoderConfig {
    let config : AudioDecoderConfig = {
      codec: "Lavf58.76.100",
      // description?: AllowSharedBufferSource | undefined;
      numberOfChannels: 2,
      sampleRate: 48000,
    }
    // if (SamplingFrequencyIndex.length > frame.header.sampling_frequency_index) {
    //   config.sampleRate = SamplingFrequencyIndex[frame.header.sampling_frequency_index];
    // }
    // if (frame.header.profile === AdtsProfile.LowComplexity) {
    //   config.codec = 'mp4a.40.2';
    // }
    return config;
  }
}