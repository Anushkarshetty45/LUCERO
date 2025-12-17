export interface StudySession {
    id: string
    userId: string
    startTime: Date
    endTime: Date | null
    totalDuration: number // seconds
    focusedDuration: number // seconds
    distractions: Distraction[]
    focusScore: number // 0-100
    milestones: string[]
    settings: SessionSettings
}

export interface Distraction {
    id: string
    type: 'tab_switch' | 'face_away' | 'looking_down' | 'talking' | 'phone_holding'
    timestamp: Date
    duration: number // seconds
    severity: 'low' | 'medium' | 'high'
    resolved: boolean
}

export interface SessionSettings {
    sensitivity: 'strict' | 'moderate' | 'relaxed'
    warningVolume: number // 0-1
    showVideoPreview: boolean
    enableMilestones: boolean
}

export interface FaceDetectionResult {
    faceDetected: boolean
    lookingDown: boolean
    isTalking: boolean
    holdingPhone: boolean
    confidence: number
}

export interface SessionStats {
    totalTime: number
    focusTime: number
    distractionCount: number
    focusScore: number
    distractionBreakdown: {
        tabSwitches: number
        faceAway: number
        lookingDown: number
        talking: number
        phoneHolding: number
    }
    quality: 'excellent' | 'good' | 'fair' | 'needs_improvement'
}

export type WarningLevel = 'none' | 'visual' | 'soft' | 'loud'
