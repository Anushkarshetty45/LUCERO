import * as faceapi from 'face-api.js'

let modelsLoaded = false

export async function loadFaceDetectionModels(): Promise<void> {
    if (modelsLoaded) return

    const MODEL_URL = '/models' // We'll need to add models to public folder

    try {
        // Load only the tiny face detector for better performance
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL)

        modelsLoaded = true
        console.log('✅ Face detection models loaded')
    } catch (error) {
        console.error('❌ Error loading face detection models:', error)
        throw error
    }
}

export interface DetectionOptions {
    inputSize?: number
    scoreThreshold?: number
}

export async function detectFace(
    video: HTMLVideoElement,
    options: DetectionOptions = {}
): Promise<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }> | undefined> {
    const {
        inputSize = 224,
        scoreThreshold = 0.5
    } = options

    try {
        const detection = await faceapi
            .detectSingleFace(
                video,
                new faceapi.TinyFaceDetectorOptions({
                    inputSize,
                    scoreThreshold
                })
            )
            .withFaceLandmarks(true)

        return detection
    } catch (error) {
        console.error('Error detecting face:', error)
        return undefined
    }
}

export function isLookingDown(landmarks: faceapi.FaceLandmarks68): boolean {
    // Get nose and chin positions
    const nose = landmarks.getNose()
    const jawline = landmarks.getJawOutline()

    if (!nose.length || !jawline.length) return false

    // Calculate vertical distance between nose and chin
    const noseTip = nose[3] // Nose tip
    const chin = jawline[8] // Chin center

    const verticalDistance = chin.y - noseTip.y

    // If vertical distance is small, head is tilted down
    // Threshold: if distance < 40 pixels, consider looking down
    return verticalDistance < 40
}

export function getFaceConfidence(detection: faceapi.FaceDetection): number {
    return detection.score
}
