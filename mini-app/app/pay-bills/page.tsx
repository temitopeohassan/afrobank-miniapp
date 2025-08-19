"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Receipt, Loader2, Zap, Droplets, Flame, Tv } from "lucide-react"
import { utilityAPI } from "@/lib/api"

export default function PayBillsPage() {
  const [selectedBiller, setSelectedBiller] = useState("")
  const [customerNumber, setCustomerNumber] = useState("")
  const [amount, setAmount] = useState("")
  const [billType, setBillType] = useState("FIXED_AMOUNT")
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [billers, setBillers] = useState([])
  const [billTypes, setBillTypes] = useState([])
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(false)
  const [billersLoading, setBillersLoading] = useState(true)
  const [validationLoading, setValidationLoading] = useState(false)
  const [billValidated, setBillValidated] = useState(false)
  const [validationResult, setValidationResult] = useState(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setBillersLoading(true)
      const [billersResponse, typesResponse, countriesResponse] = await Promise.all([
        utilityAPI.getBillers({ countryCode: 'NG', size: 50 }),
        utilityAPI.getBillTypes(),
        utilityAPI.getCountries()
      ])

      if (billersResponse && typeof billersResponse === 'object' && 'success' in billersResponse && billersResponse.success) {
        setBillers((billersResponse as any).data?.content || [])
      }
      
      if (typesResponse && typeof typesResponse === 'object' && 'success' in typesResponse && typesResponse.success) {
        setBillTypes((typesResponse as any).data || [])
      }
      
      if (countriesResponse && typeof countriesResponse === 'object' && 'success' in countriesResponse && countriesResponse.success) {
        setCountries((countriesResponse as any).data || [])
      }
    } catch (error) {
      console.error('Failed to load initial data:', error)
    } finally {
      setBillersLoading(false)
    }
  }

  const validateBill = async () => {
    if (!selectedBiller || !customerNumber) {
      alert('Please select a biller and enter customer number')
      return
    }

    try {
      setValidationLoading(true)
      const response = await utilityAPI.validateBill({
        billerId: selectedBiller,
        customerNumber,
        amount: amount ? parseFloat(amount) : undefined,
        billType
      })
      
      if (response && typeof response === 'object' && 'success' in response && response.success) {
        setValidationResult((response as any).data)
        setBillValidated(true)
        alert('Bill validated successfully! You can now proceed to payment.')
      }
    } catch (error) {
      console.error('Failed to validate bill:', error)
      alert('Failed to validate bill. Please check your details and try again.')
    } finally {
      setValidationLoading(false)
    }
  }

  const payBill = async () => {
    if (!selectedBiller || !customerNumber || !amount) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      const response = await utilityAPI.payBill({
        billerId: selectedBiller,
        customerNumber,
        amount: parseFloat(amount),
        billType,
        customerName: customerName || 'Customer',
        customerEmail: customerEmail || '',
        reference: `utility-${Date.now()}`
      })
      
      if (response && typeof response === 'object' && 'success' in response && response.success) {
        alert(`Bill payment successful! Transaction ID: ${(response as any).data?.id || 'N/A'}`)
        // Reset form
        setSelectedBiller("")
        setCustomerNumber("")
        setAmount("")
        setCustomerName("")
        setCustomerEmail("")
        setBillValidated(false)
        setValidationResult(null)
      }
    } catch (error) {
      console.error('Failed to pay bill:', error)
      alert('Failed to process bill payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getBillerIcon = (billerName: string) => {
    const name = billerName.toLowerCase()
    if (name.includes('electric') || name.includes('power')) return Zap
    if (name.includes('water')) return Droplets
    if (name.includes('gas')) return Flame
    if (name.includes('internet') || name.includes('cable') || name.includes('tv')) return Tv
    return Receipt
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
          <h1 className="text-lg font-semibold">Pay Bills</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-accent-foreground" />
            </div>
            <CardTitle className="text-xl">Pay Utility Bills</CardTitle>
            <p className="text-muted-foreground text-sm">Select your utility provider and enter bill details</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Biller Selection */}
            <div className="space-y-2">
              <Label htmlFor="biller">Utility Provider</Label>
              <Select value={selectedBiller} onValueChange={setSelectedBiller}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your utility provider" />
                </SelectTrigger>
                <SelectContent>
                  {billersLoading ? (
                    <SelectItem value="" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading providers...
                      </div>
                    </SelectItem>
                  ) : (
                    billers.map((biller: any) => {
                      const IconComponent = getBillerIcon(biller.name)
                      return (
                        <SelectItem key={biller.id} value={biller.id}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-4 h-4" />
                            {biller.name}
                          </div>
                        </SelectItem>
                      )
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Bill Type */}
            <div className="space-y-2">
              <Label htmlFor="billType">Bill Type</Label>
              <Select value={billType} onValueChange={setBillType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bill type" />
                </SelectTrigger>
                <SelectContent>
                  {billTypes.map((type: any) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Customer Number */}
            <div className="space-y-2">
              <Label htmlFor="customerNumber">Customer/Account Number</Label>
              <Input
                id="customerNumber"
                type="text"
                placeholder="Enter your customer number"
                value={customerNumber}
                onChange={(e) => setCustomerNumber(e.target.value)}
                className="text-lg"
              />
            </div>

            {/* Amount (for variable bills) */}
            {billType === 'VARIABLE_AMOUNT' && (
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                  placeholder="Enter bill amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg"
              />
            </div>
            )}

            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Customer Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="customerName">Full Name</Label>
                <Input
                  id="customerName"
                  type="text"
                  placeholder="Enter your full name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email (Optional)</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Validation Button */}
            {!billValidated && (
              <Button
                onClick={validateBill}
                disabled={!selectedBiller || !customerNumber || validationLoading}
                variant="outline"
                className="w-full"
              >
                {validationLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validating...
                  </div>
                ) : (
                  'Validate Bill'
                )}
              </Button>
            )}

            {/* Payment Button */}
            {billValidated && (
            <Button
                onClick={payBill}
                disabled={!selectedBiller || !customerNumber || !amount || loading}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              size="lg"
            >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Payment...
                  </div>
                ) : (
                  'Pay Bill Now'
                )}
            </Button>
            )}

            {/* Validation Result */}
            {validationResult && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Bill Validated Successfully</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Customer:</strong> {validationResult.customerName || 'N/A'}</p>
                  <p><strong>Amount Due:</strong> ₦{validationResult.amount || 'N/A'}</p>
                  <p><strong>Due Date:</strong> {validationResult.dueDate || 'N/A'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
