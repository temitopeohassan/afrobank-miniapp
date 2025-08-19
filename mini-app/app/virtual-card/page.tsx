"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, CreditCard, Loader2, CheckCircle } from "lucide-react"
import { useAccount } from "wagmi"

export default function VirtualCardPage() {
  const { address } = useAccount()
  const [amount, setAmount] = useState("")
  const [cardType, setCardType] = useState("debit")
  const [loading, setLoading] = useState(false)
  const [cardCreated, setCardCreated] = useState(false)
  const [cardDetails, setCardDetails] = useState(null)

  const handleCreateCard = async () => {
    if (!amount || !address) {
      alert('Please enter an amount and ensure your wallet is connected')
      return
    }

    try {
      setLoading(true)
      // Simulate API call for virtual card creation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const card = {
        id: `VC-${Date.now()}`,
        type: cardType,
        balance: parseFloat(amount),
        cardNumber: `**** **** **** ${Math.floor(Math.random() * 9000) + 1000}`,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        cvv: Math.floor(Math.random() * 900) + 100,
        status: 'active'
      }
      
      setCardDetails(card)
      setCardCreated(true)
      alert('Virtual card created successfully!')
    } catch (error) {
      console.error('Failed to create virtual card:', error)
      alert('Failed to create virtual card. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Get Virtual Card</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-accent-foreground" />
            </div>
            <CardTitle className="text-xl">Create Virtual Card</CardTitle>
            <p className="text-muted-foreground text-sm">Enter initial balance for your virtual card</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {!cardCreated ? (
              <>
                {/* Card Type Selection */}
                <div className="space-y-2">
                  <Label htmlFor="cardType">Card Type</Label>
                  <Select value={cardType} onValueChange={setCardType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select card type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debit">Virtual Debit Card</SelectItem>
                      <SelectItem value="prepaid">Virtual Prepaid Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Initial Balance */}
            <div className="space-y-2">
                  <Label htmlFor="amount">Initial Balance (₦)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg"
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-3">
                  {["1000", "5000", "10000", "25000", "50000", "100000"].map((quickAmount) => (
                <Button key={quickAmount} variant="outline" onClick={() => setAmount(quickAmount)} className="text-sm">
                      ₦{quickAmount}
                </Button>
              ))}
            </div>

                {/* Wallet Connection Check */}
                {!address && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Please connect your wallet to create a virtual card
                    </p>
                  </div>
                )}

            <Button
                  onClick={handleCreateCard}
                  disabled={!amount || !address || loading}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              size="lg"
            >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Card...
                    </div>
                  ) : (
                    'Create Virtual Card'
                  )}
                </Button>
              </>
            ) : (
              /* Card Created Success View */
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Card Created Successfully!</h3>
                  <p className="text-sm text-muted-foreground">Your virtual card is ready to use</p>
                </div>
                
                {cardDetails && (
                  <Card className="bg-accent/10 border-accent/20">
                    <CardContent className="p-4 text-left">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Card Number:</span>
                          <span className="font-mono">{cardDetails.cardNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expiry:</span>
                          <span>{cardDetails.expiryDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">CVV:</span>
                          <span className="font-mono">{cardDetails.cvv}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Balance:</span>
                          <span className="font-semibold">₦{cardDetails.balance.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button
                  onClick={() => {
                    setCardCreated(false)
                    setCardDetails(null)
                    setAmount("")
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Create Another Card
            </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
