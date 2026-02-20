// src/protocols/A0Protocol.ts
export class A0Protocol {
  static HEADER = 0xA0;

  /**
   * Calculates the checksum for the Seuic protocol (Sum of bytes, then 2's complement)
   */
  static calculateChecksum(data: Buffer): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return (0x100 - (sum & 0xFF)) & 0xFF;
  }

  /**
   * Encapsulates a command into a valid frame
   */
  static encode(address: number, cmd: number, data: number[] = []): Buffer {
    const len = data.length + 3; // Addr + Cmd + Data + Checksum
    const frame = Buffer.alloc(len + 2); // Header + Len + Payload
    
    frame[0] = this.HEADER;
    frame[1] = len;
    frame[2] = address;
    frame[3] = cmd;
    
    if (data.length > 0) {
      Buffer.from(data).copy(frame, 4);
    }

    // Checksum is calculated from Len to end of Data
    const checksum = this.calculateChecksum(frame.subarray(1, frame.length - 1));
    frame[frame.length - 1] = checksum;
    
    return frame;
  }
}