import { off } from "process";

export const enum MPEGID {
  Unknown = -1,
  MPEG4 = 0,
  MPEG2 = 1,
}

export const enum AdtsProfile {
  Main = 0,
  LowComplexity = 1,
  ScalableSamplingRate = 2,
  Reserved = 3,
}

export interface AdtsFixedHeader {
  mpegId: MPEGID;
  protection_absent: boolean;
  profile: AdtsProfile;
  sampling_frequency_index: number;
  channel_configuration: number;
}

interface AdtsVariableHeader {
  copyright_identification_bit: boolean;
  copyright_identification_start: boolean;
  aac_frame_length: number;
  adts_buffer_fullness: number;
  number_of_raw_data_blocks_in_frame: number;
}

export interface AdtsFrame {
  header: AdtsFixedHeader;
  data: Uint8Array;
}

export class AacAdtsFormat {

  protected adtsFixedHeader: AdtsFixedHeader = {
    mpegId: MPEGID.Unknown,
    protection_absent: false,
    profile: AdtsProfile.Reserved,
    sampling_frequency_index: 0,
    channel_configuration: 0,
  }

  protected adtsVariableHeader: AdtsVariableHeader = {
    copyright_identification_bit: false,
    copyright_identification_start: false,
    aac_frame_length: 0,
    adts_buffer_fullness: 0,
    number_of_raw_data_blocks_in_frame: 0,
  }

  constructor () {
  }

  public check(buffer: Uint8Array): boolean {
    this.parsekAdtsFixedHeader(buffer, 0);
    return this.adtsFixedHeader.mpegId !== MPEGID.Unknown;
  }

  public parse (buffer: Uint8Array): AdtsFrame[] {
    let frameArr: AdtsFrame[] = [];

    let offset: number = 0;
    while (offset < buffer.byteLength) {
      this.parsekAdtsFixedHeader(buffer, offset);
      this.parseAdtsVariableHeader(buffer, offset);
      frameArr.push(this.createAdtsFrame(buffer, offset));
      offset += this.adtsVariableHeader.aac_frame_length;
      this.reset();
    }
    return frameArr;
  }

  protected parsekAdtsFixedHeader (buffer: Uint8Array, offset: number): boolean {
    if (buffer.byteLength >= offset + 7) {
      this.checkSyncWord(buffer, offset);
      this.checkProfile(buffer, offset);
      this.parseChannelConfiguration(buffer, offset);
    }
    return this.adtsFixedHeader.mpegId !== MPEGID.Unknown;
  }

  protected parseAdtsVariableHeader (buffer: Uint8Array, offset: number): void {
    this.adtsVariableHeader.copyright_identification_bit = (buffer[offset + 3] & 0x8) === 0 ? false : true;
    this.adtsVariableHeader.copyright_identification_start = (buffer[offset + 3] & 0x4) === 0 ? false : true;
    this.parseFrameLength(buffer, offset);
  }

  protected createAdtsFrame (buffer: Uint8Array, offset: number): AdtsFrame {
    const headerLength: number = this.adtsFixedHeader.protection_absent ? 7 : 9;
    return {
      header: this.adtsFixedHeader,
      data: buffer.slice(offset + headerLength, offset + this.adtsVariableHeader.aac_frame_length),
    }
  }

  protected reset(): void {
    this.adtsFixedHeader = {
      mpegId: MPEGID.Unknown,
      protection_absent: false,
      profile: AdtsProfile.Reserved,
      sampling_frequency_index: 0,
      channel_configuration: 0,
    };
    this.adtsVariableHeader = {
      copyright_identification_bit: false,
      copyright_identification_start: false,
      aac_frame_length: 0,
      adts_buffer_fullness: 0,
      number_of_raw_data_blocks_in_frame: 0,
    }
  }

  /**
   * 检测syncword
   * @param buffer 
   * @returns 
   */
  private checkSyncWord (buffer: Uint8Array, offset: number): void {
    if (0xFF === buffer[offset] && (buffer[offset + 1] & 0xF0) === 0xF0) {
      this.adtsFixedHeader.protection_absent = buffer[offset + 1] & 1 ? true : false;
      // 不校验Layer
      let mpegId: number = buffer[offset + 1] & 8;
      if (8 === mpegId) {
        this.adtsFixedHeader.mpegId = MPEGID.MPEG2;
        return;
      } else if (0 === mpegId) {
        this.adtsFixedHeader.mpegId = MPEGID.MPEG4;
        return;
      }
    }
    this.adtsFixedHeader.mpegId = MPEGID.Unknown;
  }

  /**
   * 获取profieInfo
   * @param buffer 
   */
  private checkProfile(buffer: Uint8Array, offset: number): void {
    let profileNum: number = buffer[offset + 2] >> 6;
    switch (profileNum) {
      case AdtsProfile.Main:
        this.adtsFixedHeader.profile = AdtsProfile.Main;
        break;

      case AdtsProfile.LowComplexity:
        this.adtsFixedHeader.profile = AdtsProfile.LowComplexity;
        break;

      case AdtsProfile.ScalableSamplingRate:
        this.adtsFixedHeader.profile = AdtsProfile.ScalableSamplingRate;
        break;

      default:
        this.adtsFixedHeader.profile = AdtsProfile.Reserved;
        break;

    }

    this.adtsFixedHeader.sampling_frequency_index = ((buffer[offset + 2] - (profileNum << 6)) >> 2); 
  }

  private parseChannelConfiguration(buffer: Uint8Array, offset: number): void {
    this.adtsFixedHeader.channel_configuration = ((buffer[offset + 2] & 1) << 2) + (buffer[offset + 3] >> 6);
    
  }

  private parseFrameLength (buffer: Uint8Array, offset: number): void {
    this.adtsVariableHeader.aac_frame_length = ((buffer[offset + 3] & 0x3) << 11) + (buffer[offset + 4] << 3) + (buffer[offset + 5] >> 5);
    this.adtsVariableHeader.adts_buffer_fullness = ((buffer[offset + 5] & 0x1f) << 5) + (buffer[offset + 6] >> 2);
    this.adtsVariableHeader.number_of_raw_data_blocks_in_frame = (buffer[offset + 6] & 0x3);
  }
}