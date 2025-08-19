"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Smartphone, Wifi, Receipt, CreditCard, Gift } from "lucide-react"
import { useEffect } from "react"
import { sdk } from "@farcaster/miniapp-sdk"
import { WalletDisplay } from "@/components/wallet-display"

export default function HomePage() {
  const services = [
    {
      title: "Buy Airtime",
      icon: Smartphone,
      href: "/buy-airtime",
      description: "Top up your mobile phone",
    },
    {
      title: "Buy Data",
      icon: Wifi,
      href: "/buy-data",
      description: "Purchase data bundles",
    },
    {
      title: "Pay Bills",
      icon: Receipt,
      href: "/pay-bills",
      description: "Pay your utility bills",
    },
    {
      title: "Gift Cards",
      icon: Gift,
      href: "/gift-cards",
      description: "Buy digital gift cards",
    },
    {
      title: "Virtual Card",
      icon: CreditCard,
      href: "/virtual-card",
      description: "Create a virtual debit card",
    },
  ]

  useEffect(() => {
    // This is required for Farcaster Mini Apps
    // It hides the splash screen and displays your content
    const initializeFarcaster = async () => {
      try {
        await sdk.actions.ready()
        console.log("Farcaster Mini App is ready!")
      } catch (error) {
        console.error("Error initializing Farcaster:", error)
      }
    }

    initializeFarcaster()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-center mb-4">Afro Bank</h1>
          <p className="text-center text-sm opacity-90 mb-4">Your trusted financial partner</p>
          
          {/* Wallet Display */}
          <div className="mt-4">
            <WalletDisplay />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Services</h2>
          <p className="text-muted-foreground text-sm">Choose a service to get started</p>
        </div>

        {/* Service Panels Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {services.map((service) => {
            const IconComponent = service.icon
            return (
              <Link key={service.title} href={service.href}>
                <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer border-border">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4 flex justify-center">
                      <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-accent-foreground" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-card-foreground text-sm mb-2">{service.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{service.description}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 space-y-3">
          <Button variant="outline" className="w-full bg-transparent" asChild>
            <Link href="/transactions">View Transactions</Link>
          </Button>
          <Button variant="outline" className="w-full bg-transparent" asChild>
            <Link href="/profile">Account Settings</Link>
          </Button>
        </div>
      </main>

      {/* Bottom Navigation Placeholder */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="max-w-md mx-auto flex justify-around py-3">
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1">
            <div className="w-5 h-5 bg-accent rounded-sm"></div>
            <span className="text-xs">Home</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1">
            <div className="w-5 h-5 bg-muted rounded-sm"></div>
            <span className="text-xs">History</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1">
            <div className="w-5 h-5 bg-muted rounded-sm"></div>
            <span className="text-xs">Profile</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1">
            <div className="w-5 h-5 bg-muted rounded-sm"></div>
            <span className="text-xs">Support</span>
          </Button>
        </div>
      </nav>
    </div>
  )
}
