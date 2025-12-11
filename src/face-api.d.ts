declare module 'face-api.js' {
  export namespace nets {
    export const tinyFaceDetector: any;
    export const faceLandmark68TinyNet: any;
  }

  export class TinyFaceDetectorOptions {
    constructor(options?: { inputSize?: number; scoreThreshold?: number });
  }

  export interface FaceDetection {
    score: number;
    box: any;
  }

  export interface FaceLandmarks68 {
    getNose(): Array<{ x: number; y: number }>;
    getJawOutline(): Array<{ x: number; y: number }>;
  }

  export interface WithFaceLandmarks<T> {
    detection: T['detection'];
    landmarks: FaceLandmarks68;
  }

  export function detectSingleFace(
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    options?: any
  ): any;
}
