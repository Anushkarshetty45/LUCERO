import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../services/supabase'
import { SubscriptionPlan, Profile } from '../types'

interface SubscriptionLimits {
  canUploadPDF: boolean
  canSendAIMessage: boolean
  remainingPDFUploads: number
  remainingAIMessages: number
  isPro: boolean
}

export function useSubscription() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [limits, setLimits] = useState<SubscriptionLimits>({
    canUploadPDF: true,
    canSendAIMessage: true,
    remainingPDFUploads: 5,
    remainingAIMessages: 30,
    isPro: false
  })

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single()

      if (error) throw error

      setProfile(data)
      updateLimits(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateLimits = (profileData: Profile) => {
    const isPro = profileData.subscription_plan === 'pro'

    setLimits({
      canUploadPDF: isPro || profileData.monthly_pdf_uploads < 5,
      canSendAIMessage: isPro || profileData.monthly_ai_messages < 30,
      remainingPDFUploads: isPro ? Infinity : Math.max(0, 5 - profileData.monthly_pdf_uploads),
      remainingAIMessages: isPro ? Infinity : Math.max(0, 30 - profileData.monthly_ai_messages),
      isPro
    })
  }

  const checkLimit = async (limitType: 'pdf_upload' | 'ai_message'): Promise<boolean> => {
    if (!user) return false

    try {
      const { data, error } = await supabase.rpc('check_plan_limit', {
        p_user_id: user.id,
        p_limit_type: limitType
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error checking limit:', error)
      return false
    }
  }

  const incrementUsage = async (usageType: 'pdf_upload' | 'ai_message') => {
    if (!user) return

    try {
      await supabase.rpc('increment_usage', {
        p_user_id: user.id,
        p_usage_type: usageType
      })

      // Reload profile to get updated usage
      await loadProfile()
    } catch (error) {
      console.error('Error incrementing usage:', error)
    }
  }

  const upgradeToPro = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_plan: 'pro',
          subscription_status: 'active',
          subscription_started_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      // Log to subscription history
      await supabase
        .from('subscription_history')
        .insert({
          user_id: user.id,
          plan: 'pro',
          action: 'upgrade'
        })

      await loadProfile()
    } catch (error) {
      console.error('Error upgrading to Pro:', error)
      throw error
    }
  }

  const downgradeToFree = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_plan: 'free',
          subscription_status: 'active'
        })
        .eq('id', user.id)

      if (error) throw error

      // Log to subscription history
      await supabase
        .from('subscription_history')
        .insert({
          user_id: user.id,
          plan: 'free',
          action: 'downgrade'
        })

      await loadProfile()
    } catch (error) {
      console.error('Error downgrading to Free:', error)
      throw error
    }
  }

  return {
    profile,
    loading,
    limits,
    checkLimit,
    incrementUsage,
    upgradeToPro,
    downgradeToFree,
    refreshProfile: loadProfile
  }
}
