"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Smartphone, Loader2 } from "lucide-react"
import { topupAPI } from "@/lib/api"

export default function BuyAirtimePage() {
  const [amount, setAmount] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [selectedOperator, setSelectedOperator] = useState("")
  const [operators, setOperators] = useState([])
  const [loading, setLoading] = useState(false)
  const [operatorsLoading, setOperatorsLoading] = useState(true)

  useEffect(() => {
    loadOperators()
  }, [])

  const loadOperators = async () => {
    try {
      setOperatorsLoading(true)
      const response = await topupAPI.getOperators({ countryCode: 'NG', size: 50 })
      if (response && typeof response === 'object' && 'success' in response && response.success) {
        setOperators((response as any).data?.content || [])
      }
    } catch (error) {
      console.error('Failed to load operators:', error)
    } finally {
      setOperatorsLoading(false)
    }
  }

  const handleBuyNow = async () => {
    if (!amount || !phoneNumber || !selectedOperator) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      const response = await topupAPI.sendTopup({
        operatorId: selectedOperator,
        amount: parseFloat(amount),
        useLocalAmount: true,
        recipientPhoneNumber: phoneNumber,
        reference: `airtime-${Date.now()}`
      })
      
      if (response && typeof response === 'object' && 'success' in response && response.success) {
        alert(`Airtime purchase successful! Transaction ID: ${(response as any).data?.id || 'N/A'}`)
        setAmount("")
        setPhoneNumber("")
        setSelectedOperator("")
      }
    } catch (error) {
      console.error('Failed to purchase airtime:', error)
      alert('Failed to purchase airtime. Please try again.')
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
          <h1 className="text-lg font-semibold">Buy Airtime</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-accent-foreground" />
            </div>
            <CardTitle className="text-xl">Top Up Your Phone</CardTitle>
            <p className="text-muted-foreground text-sm">Enter the amount you want to purchase</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Operator Selection */}
            <div className="space-y-2">
              <Label htmlFor="operator">Mobile Operator</Label>
              <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your operator" />
                </SelectTrigger>
                <SelectContent>
                  {operatorsLoading ? (
                    <SelectItem value="" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading operators...
                      </div>
                    </SelectItem>
                  ) : (
                    operators.map((operator: any) => (
                      <SelectItem key={operator.id} value={operator.id}>
                        {operator.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="text-lg"
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₦)</Label>
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
              {["100", "200", "500", "1000", "2000", "5000"].map((quickAmount) => (
                <Button key={quickAmount} variant="outline" onClick={() => setAmount(quickAmount)} className="text-sm">
                  ₦{quickAmount}
                </Button>
              ))}
            </div>

            <Button
              onClick={handleBuyNow}
              disabled={!amount || !phoneNumber || !selectedOperator || loading}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </div>
              ) : (
                'Buy Now'
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
