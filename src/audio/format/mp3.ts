
/**
 * 解析Mp3格式
 * @doc https://wenku.baidu.com/view/63c13824eb7101f69e3143323968011ca300f7f9.html?_wkts_=1707874112105&bdQuery=mp3%E6%A0%BC%E5%BC%8F%E8%A7%A3%E6%9E%90
 */
export class Mp3Format {
  
  constructor () {

  }

  public check (buffer: Uint8Array): boolean {
    return this.checkID3V2(buffer) && this.checkAudioData(buffer) && this.checkID3V1(buffer);
  }

  protected checkID3V2 (buffer: Uint8Array): boolean {
    return false;
  } 

  protected checkAudioData (buffer: Uint8Array): boolean {
    return false;
  }

  protected checkID3V1 (buffer: Uint8Array): boolean {
    return false;
  }
} 