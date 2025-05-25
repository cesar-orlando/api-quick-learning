declare module "fft-js" {
  export function fft(input: number[]): any[];
  export namespace util {
    function fftMag(phasors: any[]): number[];
  }
}