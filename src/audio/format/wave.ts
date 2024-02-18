
/**
 * Wave格式头检测
 */
export class WaveFormat {

  constructor () {
  }

  public check (buffer: Uint8Array): boolean {

    if (buffer.byteLength > 44) {
      return this.checkRIFF(buffer) && this.checkWave(buffer) && this.checkFMT(buffer) && this.checkPCMWaveFormat(buffer);
    }

    return false;
  }

  protected checkRIFF (buffer: Uint8Array): boolean {
    return 0x52 === buffer[0] && 0x49 === buffer[1] && 0x46 === buffer[2] && 0x46 === buffer[3];
  }

  protected checkWave (buffer: Uint8Array): boolean {
    return 0x57 === buffer[8] && 0x41 === buffer[9] && 0x56 === buffer[10] && 0x45 === buffer[11];
  }

  protected checkFMT (buffer: Uint8Array): boolean {
    return 0x66 === buffer[12] && 0x6D === buffer[13] && 0x74 === buffer[14] && 0x20 === buffer[15]; 
  }

  protected checkPCMWaveFormat (buffer: Uint8Array): boolean {
    return 0x10 === buffer[16] && 0 === buffer[17] && 0 === buffer[18] && 0 === buffer[19];
  }
}