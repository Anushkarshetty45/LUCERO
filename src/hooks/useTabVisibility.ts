import { useState, useEffect } from 'react'

export function useTabVisibility() {
    const [isTabVisible, setIsTabVisible] = useState(true)
    const [tabSwitchCount, setTabSwitchCount] = useState(0)

    useEffect(() => {
        const handleVisibilityChange = () => {
            const visible = !document.hidden
            setIsTabVisible(visible)

            // Count tab switches (when user leaves the tab)
            if (!visible) {
                setTabSwitchCount(prev => prev + 1)
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [])

    const resetCount = () => setTabSwitchCount(0)

    return {
        isTabVisible,
        tabSwitchCount,
        resetCount
    }
}
