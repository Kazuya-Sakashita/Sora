"use client"

import { AppProvider, useApp } from "@/lib/app-context"
import { SkyBackground } from "@/components/sky-background"
import { OnboardingScreen } from "@/components/screens/onboarding"
import { ProfileCreateScreen } from "@/components/screens/profile-create"
import { HomeScreen } from "@/components/screens/home"
import { ChatScreen } from "@/components/screens/chat"
import { TimelineScreen } from "@/components/screens/timeline"
import { LetterScreen } from "@/components/screens/letter"
import { FeelingsScreen } from "@/components/screens/feelings"
import { SettingsScreen } from "@/components/screens/settings"

function AppContent() {
  const { currentScreen } = useApp()

  const renderScreen = () => {
    switch (currentScreen) {
      case "onboarding":
        return <OnboardingScreen />
      case "profile-create":
        return <ProfileCreateScreen />
      case "home":
        return <HomeScreen />
      case "chat":
        return <ChatScreen />
      case "timeline":
        return <TimelineScreen />
      case "letter":
        return <LetterScreen />
      case "feelings":
        return <FeelingsScreen />
      case "settings":
        return <SettingsScreen />
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
