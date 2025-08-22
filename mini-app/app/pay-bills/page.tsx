"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Receipt, Loader2, Zap, Droplets, Flame, Tv, Check, X } from "lucide-react"
import { utilityAPI } from "@/lib/api"
import { useAccount, useWalletClient, usePublicClient, useConnect } from "wagmi"
import { parseUnits, formatUnits } from "viem"
import { injected } from 'wagmi/connectors'
import { PAYMENTPROCESSOR_ABI, PAYMENTPROCESSOR_ADDRESS, USDC_ADDRESS } from "@/app/constants/PaymentProcessorAbi"
import { config } from "@/app/config"

export default function PayBillsPage() {
  const [selectedBiller, setSelectedBiller] = useState("")
  const [customerNumber, setCustomerNumber] = useState("")
  const [amount, setAmount] = useState("")
  const [billType, setBillType] = useState("FIXED_AMOUNT")
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [billers, setBillers] = useState<any[]>([])
  const [billTypes, setBillTypes] = useState<any[]>([])
  const [countries, setCountries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [billersLoading, setBillersLoading] = useState(true)
  const [validationLoading, setValidationLoading] = useState(false)
  const [billValidated, setBillValidated] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  
  // Blockchain state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [transactionStatus, setTransactionStatus] = useState("")
  const [paymentId, setPaymentId] = useState<number | null>(null)
  const [usdcAmount, setUsdcAmount] = useState<number>(0)

  // Wagmi hooks
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { connect } = useConnect()

  useEffect(() => {
    loadInitialData()
  }, [])

  // Auto connect wallet on component mount
  useEffect(() => {
    const autoConnect = async () => {
      try {
        if (!isConnected) {
          console.log("Attempting to auto-connect wallet...")
          await connect({ connector: injected() })
        }
      } catch (error) {
        console.error("Auto-connect failed:", error)
      }
    }
    autoConnect()
  }, [isConnected, connect])

  // Calculate USDC amount when amount changes
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      // Convert NGN to USD (approximate rate, you can use real-time rates)
      const ngnAmount = parseFloat(amount)
      const usdValue = ngnAmount / 1500 // Approximate NGN to USD rate
      setUsdcAmount(usdValue)
    } else {
      setUsdcAmount(0)
    }
  }, [amount])

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

  const initiateBlockchainPayment = async () => {
    if (!walletClient || !address || !publicClient) {
      throw new Error("Wallet not connected")
    }

    setTransactionStatus("Initiating payment...")
    console.log(`Initiating payment for ${formatUnits(parseUnits(usdcAmount.toFixed(6), 6), 6)} USDC`)

    try {
      // Check if USDC is supported by the PaymentProcessor
      const isSupported = await publicClient.readContract({
        address: PAYMENTPROCESSOR_ADDRESS as `0x${string}`,
        abi: PAYMENTPROCESSOR_ABI,
        functionName: "isSupportedToken",
        args: [USDC_ADDRESS as `0x${string}`]
      })

      if (!isSupported) {
        throw new Error("USDC is not supported by the PaymentProcessor")
      }

      // Initiate payment through PaymentProcessor
      const { request } = await publicClient.simulateContract({
        address: PAYMENTPROCESSOR_ADDRESS as `0x${string}`,
        abi: PAYMENTPROCESSOR_ABI,
        functionName: "initiatePayment",
        args: [USDC_ADDRESS as `0x${string}`, parseUnits(usdcAmount.toFixed(6), 6)],
        account: address
      })

      const txHash = await walletClient.writeContract(request)
      console.log("Payment initiated, transaction hash:", txHash)

      setTransactionStatus("Waiting for payment confirmation...")
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 60000
      })

      if (receipt.status === 'reverted') {
        throw new Error("Payment transaction was reverted")
      }

      // Get the payment ID from the transaction logs
      const paymentInitiatedEvent = receipt.logs.find(log => {
        try {
          // For now, we'll set a default payment ID
          // In a production environment, you'd want to properly decode the logs
          return true
        } catch {
          return false
        }
      })

      if (paymentInitiatedEvent) {
        // Set a default payment ID for now
        setPaymentId(Math.floor(Math.random() * 1000000))
      }

      console.log("Payment successful")
      return txHash
    } catch (error) {
      console.error("Error initiating payment:", error)
      throw error
    }
  }

  const payBill = async () => {
    if (!selectedBiller || !customerNumber || !amount) {
      alert('Please fill in all required fields')
      return
    }

    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    setShowConfirmModal(true)
  }

  const handleConfirmedPayment = async () => {
    try {
      setLoading(true)
      setShowConfirmModal(false)

      // First, process blockchain payment
      const txHash = await initiateBlockchainPayment()

      // If blockchain payment is successful, proceed with bill payment
      if (txHash) {
        setTransactionStatus("Processing bill payment...")
        const response = await utilityAPI.payBill({
          billerId: selectedBiller,
          customerNumber,
          amount: parseFloat(amount),
          billType,
          customerName: customerName || 'Customer',
          customerEmail: customerEmail || '',
          reference: `utility-${Date.now()}`,
          // Note: blockchainTxHash and paymentId are stored locally for reference
          // but not sent to the API as they're not part of the expected payload
        })
        
        if (response && typeof response === 'object' && 'success' in response && response.success) {
          setShowSuccessModal(true)
          // Reset form
          setSelectedBiller("")
          setCustomerNumber("")
          setAmount("")
          setCustomerName("")
          setCustomerEmail("")
          setBillValidated(false)
          setValidationResult(null)
          setPaymentId(null)
        }
      }
    } catch (error) {
      console.error('Failed to process bill payment:', error)
      let errorMessage = "Transaction failed. Please try again."
      
      if (error instanceof Error) {
        if (error.message.includes("user rejected")) {
          errorMessage = "Transaction was rejected. Please try again."
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient USDC balance. Please check your wallet."
        } else {
          errorMessage = error.message
        }
      }
      
      setErrorMessage(errorMessage)
      setShowErrorModal(true)
    } finally {
      setLoading(false)
      setTransactionStatus("")
    }
  }

  const resetForm = () => {
    setSelectedBiller("")
    setCustomerNumber("")
    setAmount("")
    setCustomerName("")
    setCustomerEmail("")
    setBillValidated(false)
    setValidationResult(null)
    setPaymentId(null)
    setShowConfirmModal(false)
    setShowErrorModal(false)
    setShowSuccessModal(false)
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
                    <SelectItem value="loading" disabled>
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

            {/* USDC Amount Display */}
            {usdcAmount > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">USDC Amount:</span>
                  <span className="text-sm font-medium text-gray-400 dark:text-white">
                    ${usdcAmount.toFixed(2)} USDC
                  </span>
                </div>
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

            {/* Wallet Connection Status */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Wallet Status:</span>
                <span className={`text-sm ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              {isConnected && address && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </p>
              )}
            </div>

            {/* Payment Button */}
            {billValidated && (
              <Button
                onClick={payBill}
                disabled={!selectedBiller || !customerNumber || !amount || loading || !isConnected}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Payment...
                  </div>
                ) : !isConnected ? (
                  'Connect Wallet to Pay'
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Please confirm the details of your bill payment:
            </p>
            <div className="space-y-2 mb-6">
              <p className="text-center dark:text-white">
                <span className="font-bold">Provider:</span> {billers.find((b: any) => b.id === selectedBiller)?.name || 'N/A'}
              </p>
              <p className="text-center dark:text-white">
                <span className="font-bold">Amount:</span> ₦{amount}
              </p>
              <p className="text-center dark:text-white">
                <span className="font-bold">USDC Value:</span> ${usdcAmount.toFixed(2)}
              </p>
              <p className="text-center dark:text-white">
                <span className="font-bold">Customer Number:</span> {customerNumber}
              </p>
            </div>
            {transactionStatus && (
              <p className="text-blue-500 text-center mb-4">{transactionStatus}</p>
            )}
            <div className="flex justify-end space-x-4">
              <Button variant="ghost" onClick={() => setShowConfirmModal(false)} disabled={loading}>
                Edit
              </Button>
              <Button onClick={handleConfirmedPayment} disabled={loading}>
                {loading ? "Processing..." : "Confirm Payment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                <X className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Payment Failed
              </h3>
              <p className="text-red-600 dark:text-red-400 mb-4">{errorMessage}</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowErrorModal(false)}>Dismiss</Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Bill Payment Successful
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your utility bill has been paid successfully.
              </p>
              {paymentId && (
                <p className="text-sm text-gray-500 mt-2">Payment ID: {paymentId}</p>
              )}
            </div>
            <div className="flex justify-center">
              <Button onClick={resetForm}>Done</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
