
/**
 * 解析OPUS格式
 * @doc https://juejin.cn/post/6844904016254599175
 */
export class OggOpusFormat {

  protected packageArr: OpusPackage[] = [];

  public check (buffer: Uint8Array): boolean {
    return this.checkOggHead(buffer, 0);
  } 

  public parse (buffer: Uint8Array): any[] {
    let offset: number = 0;
    console.log("length:", buffer.byteLength);
    let headerType: number = -1;
    let packageVersion: number = -1;
    while (offset < buffer.byteLength) {
      // this.parsekAdtsFixedHeader(buffer, offset);
      if (this.checkOggHead(buffer, offset)) {
        packageVersion = this.getVersion(buffer, offset);
        headerType = this.getHeaderType(buffer, offset);
        this.getGranulePosition(buffer, offset);
        this.getSerialNumber(buffer, offset);
        this.getPageSeguenceNumber(buffer, offset);
        this.getCRCCbecksum(buffer, offset);
        const numberPageSegments: number = this.getNumberPageSegments(buffer, offset);
        const segmentTable: number = this.getSegmentTable(buffer, offset, numberPageSegments);

        let end: number = offset + 27 + numberPageSegments + segmentTable;
        if (end <= buffer.byteLength) {
          this.packageArr.push(new OpusPackage(buffer.slice(offset+27+numberPageSegments, end)))
        }
        offset = end;
      } else {
        console.error('data error')
        break;
      }
      // this.reset();
    }
    return this.packageArr;
  }

  protected checkOggHead (buffer: Uint8Array, offset: number): boolean {
    return buffer.byteLength > 4 && 0x4F === buffer[offset] && 0x67 === buffer[offset + 1] && 0x67 === buffer[offset + 2] && 0x53 === buffer[offset + 3];
  }

  protected getVersion (buffer: Uint8Array, offset: number): number {
    return buffer[offset+4];
  }

  protected getHeaderType (buffer: Uint8Array, offset: number): number {
    if (buffer.length >= offset + 5) {
      return buffer[offset + 5];
    }
    return -1;
  }

  protected getGranulePosition (buffer: Uint8Array, offset: number): void {
    // 8Byte
    // offset+6 ~ offset+13
  }

  protected getSerialNumber (buffer: Uint8Array, offset: number): void {
    // 4Byte
    // offset+14 ~ offset+17
  }

  protected getPageSeguenceNumber (buffer: Uint8Array, offset: number): void {
    // 4Byte
    // offset+18 ~ offset+21
  }

  protected getCRCCbecksum (buffer: Uint8Array, offset: number): void {
    // 4Byte
    // offset+22 ~ offset+25
  }

  protected getNumberPageSegments (buffer: Uint8Array, offset: number): number {
    // 1Byte
    return buffer[offset + 26];
  }

  protected getSegmentTable (buffer: Uint8Array, offset: number, numberPageSegments: number): number {
    let count: number = 0;
    for (let i = 0; i < numberPageSegments; ++i) {
      count += buffer[offset + i + 27];
    }
    return count;
  }

  // protected parsePackage (buffer: Uint8Array): void {
  //   console.log("parsePackage: ", buffer.byteLength);
  // }

}


export interface OpusHead {
  version: number;
  channelCount: number;
  preSkip: number;
  inputSampleRate: number;
  outputGain: number;
  channelMappingFamily: number;
  channelMappingTable: number;
}

export interface OpusCommentHead {
  vendorStringLength: number;
  vendorString: string;
  userCommentListLength: number;
  comentArr: string[];
}

export class OpusPackage {

  protected head: OpusHead = {
    version: 0,
    channelCount: 0,
    preSkip: 0,
    inputSampleRate: 0,
    outputGain: 0,
    channelMappingFamily: 0,
    channelMappingTable: 0,
  }

  protected comment: OpusCommentHead = {
    vendorStringLength: 0,
    vendorString: "",
    userCommentListLength: 0,
    comentArr: [],
  }

  constructor (buffer: Uint8Array) {
    if (this.checkOpus(buffer)) {
      if (this.checkHead(buffer)) {
        this.parseOpusHeadPackage(buffer);
      } else if (this.checkTags(buffer)) {
        this.parseCommentHead(buffer);
      }
    }
  }

  protected checkOpus (buffer: Uint8Array): boolean {
    return 0x4F === buffer[0] && 0x70 === buffer[1] && 0x75 === buffer[2] && 0x73 === buffer[3];
  }

  protected checkHead (buffer: Uint8Array): boolean {
    return 0x48 === buffer[4] && 0x65 === buffer[5] && 0x61 === buffer[6] && 0x64 === buffer[7];
  }

  protected checkTags (buffer: Uint8Array): boolean {
    return 0x54 === buffer[4] && 0x61 === buffer[5] && 0x67 === buffer[6] && 0x73 === buffer[7];
  }

  private parseOpusHeadPackage (buffer: Uint8Array): void {
    this.head.version = buffer[8];
    this.head.channelCount = buffer[9];

    this.head.preSkip = (buffer[10] << 8) + buffer[11];
    this.head.inputSampleRate = buffer[12] + (buffer[13] << 8) + (buffer[14] << 16) + (buffer[15] << 24);
    this.head.outputGain = 0;
    this.head.channelMappingFamily = buffer[18];
    if (this.head.channelMappingFamily !== 0) {
      // get Channel Mapping Table 
    }
    console.log(buffer, " version:", this.head);
  }

  private parseCommentHead (buffer: Uint8Array): void {
    let offset: number = 8;
    this.comment.vendorStringLength = buffer[offset] + (buffer[offset+1] << 8) + (buffer[offset+2] << 16) + (buffer[offset+3] << 24);
    offset += 4;
    this.comment.vendorString = this.uint8ArrayToString(buffer, offset, this.comment.vendorStringLength); //new TextDecoder().decode(buffer.slice(offset, offset + this.comment.vendorStringLength));
    offset += this.comment.vendorStringLength;
    this.comment.userCommentListLength = buffer[offset] + (buffer[offset+1] << 8) + (buffer[offset+2] << 16) + (buffer[offset+3] << 24);
    offset += 4;
    this.comment.comentArr.splice(0);
    for (let i = 0; i < this.comment.userCommentListLength; ++i) {
      let userCommentLength: number = buffer[offset] + (buffer[offset+1] << 8) + (buffer[offset+2] << 16) + (buffer[offset+3] << 24);
      offset += 4;
      this.comment.comentArr.push(this.uint8ArrayToString(buffer, offset, userCommentLength));
      offset += userCommentLength;
    } 

    console.log(buffer, "comment:", this.comment, "    offset:", offset);
  }

  private uint8ArrayToString (buffer: Uint8Array, offset: number, length: number): string {
    console.log("offset:", offset, "   length:", length);
    if (offset + length <= buffer.length) {
      return new TextDecoder().decode(buffer.slice(offset, offset + length));
    }
    return "";
  }
}

