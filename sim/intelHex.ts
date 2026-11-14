/**
 * Intel HEX format parser
 * Parses standard Intel .hex files (e.g. from arduino-cli / avr-gcc) into byte arrays.
 */

export interface ParsedHex {
  data: Uint8Array;
  bytesTotal: number;
  startAddress: number;
  endAddress: number;
}

export function parseIntelHex(hexString: string, maxMemorySize = 32768): ParsedHex {
  const memory = new Uint8Array(maxMemorySize);
  let bytesTotal = 0;
  let minAddress = maxMemorySize;
  let maxAddress = 0;
  let baseAddress = 0;

  const lines = hexString.split(/\r?\n/);

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex].trim();
    if (!rawLine || !rawLine.startsWith(':')) {
      continue;
    }

    const byteCount = parseInt(rawLine.slice(1, 3), 16);
    const address = parseInt(rawLine.slice(3, 7), 16) + baseAddress;
    const recordType = parseInt(rawLine.slice(7, 9), 16);
    const dataStr = rawLine.slice(9, 9 + byteCount * 2);

    // Record types:
    // 00: Data
    // 01: End Of File
    // 02: Extended Segment Address
    // 04: Extended Linear Address
    if (recordType === 0) {
      for (let i = 0; i < byteCount; i++) {
        const byte = parseInt(dataStr.slice(i * 2, i * 2 + 2), 16);
        const targetAddr = address + i;
        if (targetAddr < maxMemorySize) {
          memory[targetAddr] = byte;
          bytesTotal++;
          if (targetAddr < minAddress) minAddress = targetAddr;
          if (targetAddr > maxAddress) maxAddress = targetAddr;
        }
      }
    } else if (recordType === 1) {
      // EOF
      break;
    } else if (recordType === 2) {
      baseAddress = parseInt(dataStr, 16) << 4;
    } else if (recordType === 4) {
      baseAddress = parseInt(dataStr, 16) << 16;
    }
  }

  return {
    data: memory,
    bytesTotal,
    startAddress: minAddress < maxMemorySize ? minAddress : 0,
    endAddress: maxAddress,
  };
}
