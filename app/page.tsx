"use client"

import { AppProvider, useApp } from "@/lib/app-context"
import { SkyBackground } from "@/components/sky-background"
import { OnboardingScreen } from "@/components/screens/onboarding"
import { ProfileCreateScreen } from "@/components/screens/profile-create"
import { HomeScreen } from "@/components/screens/home"
import { TimelineScreen } from "@/components/screens/timeline"
import { FeelingsScreen } from "@/components/screens/feelings"
import { SettingsScreen } from "@/components/screens/settings"
import { ScheduleScreen } from "@/components/screens/schedule"
import { LetterScreen } from "@/components/screens/letter"
import { ChatScreen } from "@/components/screens/chat"
import { FirstRecordScreen } from "@/components/screens/first-record"

function AppContent() {
  const { currentScreen, isLoading } = useApp()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary/80 animate-spin" />
      </div>
    )
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "onboarding":
        return <OnboardingScreen />
      case "profile-create":
        return <ProfileCreateScreen />
      case "first-record":
        return <FirstRecordScreen />
      case "home":
        return <HomeScreen />
      case "timeline":
        return <TimelineScreen />
      case "feelings":
        return <FeelingsScreen />
      case "settings":
        return <SettingsScreen />
      case "schedule":
        return <ScheduleScreen />
      case "letter":
        return <LetterScreen />
      case "chat":
        return <ChatScreen />
      default:
        return <OnboardingScreen />
    }
  }

  return (
    <>
      <SkyBackground />
      <div className="relative min-h-screen max-w-md mx-auto">
        {renderScreen()}
      </div>
    </>
  )
}

export default function Page() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
