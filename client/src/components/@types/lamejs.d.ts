declare module 'lamejs' {
  export const version: string;

  export class Mp3Encoder {
    constructor(channels: number, sampleRate: number, kbps: number);
    encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
    flush(): Int8Array;
  }

  export class WavHeader {
    constructor();
  }

  const lib: {
    Mp3Encoder: typeof Mp3Encoder;
    WavHeader: typeof WavHeader;
  };

  export default lib;
}