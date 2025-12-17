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

/**
 * Detects if the user is talking by measuring mouth opening
 * Uses facial landmarks to calculate distance between upper and lower lip
 */
export function isTalking(landmarks: faceapi.FaceLandmarks68): boolean {
    // Access landmark points as an array
    // FaceLandmarks68 has 68 points indexed 0-67
    const points = landmarks as any

    // Mouth landmarks: 48-67 (20 points)
    // Point 62: Top of upper lip (inner)
    // Point 66: Bottom of lower lip (inner)
    const upperLipCenter = points._positions ? points._positions[62] : points[62]
    const lowerLipCenter = points._positions ? points._positions[66] : points[66]

    if (!upperLipCenter || !lowerLipCenter) return false

    // Calculate vertical distance between lips
    const mouthOpening = Math.abs(lowerLipCenter.y - upperLipCenter.y)

    // Threshold: if mouth opening > 8 pixels, consider talking
    // This may need adjustment based on camera distance and resolution
    return mouthOpening > 8
}

/**
 * Detects if the user might be holding a phone to their ear
 * Uses head tilt angle - people typically tilt head 15-30 degrees when holding phone
 */
export function isHoldingPhone(landmarks: faceapi.FaceLandmarks68): boolean {
    const jawline = landmarks.getJawOutline()
    if (jawline.length < 17) return false

    // Get left and right jaw points
    const leftJaw = jawline[0]   // Left side of jawline
    const rightJaw = jawline[16]  // Right side of jawline

    // Calculate horizontal distance between jaw points
    const jawWidth = Math.abs(rightJaw.x - leftJaw.x)

    // Calculate vertical difference (head tilt)
    const verticalDiff = Math.abs(rightJaw.y - leftJaw.y)

    // Calculate tilt ratio: higher ratio = more tilted head
    const tiltRatio = verticalDiff / jawWidth

    // Threshold: if tilt ratio > 0.15 (roughly 15-20 degrees), consider holding phone
    // Normal upright head has tilt ratio < 0.1
    return tiltRatio > 0.15
}
