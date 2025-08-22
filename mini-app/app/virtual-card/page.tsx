"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, CreditCard, Loader2, CheckCircle, Check, X } from "lucide-react"
import { useAccount, useWalletClient, usePublicClient, useConnect } from "wagmi"
import { parseUnits, formatUnits } from "viem"
import { injected } from 'wagmi/connectors'
import { PAYMENTPROCESSOR_ABI, PAYMENTPROCESSOR_ADDRESS, USDC_ADDRESS } from "@/app/constants/PaymentProcessorAbi"
import { config } from "@/app/config"

export default function VirtualCardPage() {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState("")
  const [cardType, setCardType] = useState("debit")
  const [loading, setLoading] = useState(false)
  const [cardCreated, setCardCreated] = useState(false)
  const [cardDetails, setCardDetails] = useState<any>(null)
  
  // Blockchain state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [transactionStatus, setTransactionStatus] = useState("")
  const [paymentId, setPaymentId] = useState<number | null>(null)
  const [usdcAmount, setUsdcAmount] = useState<number>(0)

  // Wagmi hooks
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { connect } = useConnect()

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

  const handleCreateCard = async () => {
    if (!amount || !address) {
      alert('Please enter an amount and ensure your wallet is connected')
      return
    }

    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    setShowConfirmModal(true)
  }

  const handleConfirmedCardCreation = async () => {
    try {
      setLoading(true)
      setShowConfirmModal(false)

      // First, process blockchain payment
      const txHash = await initiateBlockchainPayment()

      // If blockchain payment is successful, proceed with virtual card creation
      if (txHash) {
        setTransactionStatus("Creating virtual card...")
        
        // Simulate API call for virtual card creation
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const card = {
          id: `VC-${Date.now()}`,
          type: cardType,
          balance: parseFloat(amount),
          cardNumber: `**** **** **** ${Math.floor(Math.random() * 9000) + 1000}`,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          cvv: Math.floor(Math.random() * 900) + 100,
          status: 'active',
          // Note: blockchainTxHash and paymentId are stored locally for reference
          // but not part of the API payload
        }
        
        setCardDetails(card)
        setCardCreated(true)
        setShowSuccessModal(true)
      }
    } catch (error) {
      console.error('Failed to create virtual card:', error)
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
    setAmount("")
    setCardType("debit")
    setCardCreated(false)
    setCardDetails(null)
    setPaymentId(null)
    setShowConfirmModal(false)
    setShowErrorModal(false)
    setShowSuccessModal(false)
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

                <Button
                  onClick={handleCreateCard}
                  disabled={!amount || !address || loading || !isConnected}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Card...
                    </div>
                  ) : !isConnected ? (
                    'Connect Wallet to Create Card'
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Please confirm the details of your virtual card creation:
            </p>
            <div className="space-y-2 mb-6">
              <p className="text-center dark:text-white">
                <span className="font-bold">Card Type:</span> {cardType === 'debit' ? 'Virtual Debit Card' : 'Virtual Prepaid Card'}
              </p>
              <p className="text-center dark:text-white">
                <span className="font-bold">Initial Balance:</span> ₦{amount}
              </p>
              <p className="text-center dark:text-white">
                <span className="font-bold">USDC Value:</span> ${usdcAmount.toFixed(2)}
              </p>
            </div>
            {transactionStatus && (
              <p className="text-blue-500 text-center mb-4">{transactionStatus}</p>
            )}
            <div className="flex justify-end space-x-4">
              <Button variant="ghost" onClick={() => setShowConfirmModal(false)} disabled={loading}>
                Edit
              </Button>
              <Button onClick={handleConfirmedCardCreation} disabled={loading}>
                {loading ? "Processing..." : "Confirm Creation"}
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
                Card Creation Failed
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
                Virtual Card Created Successfully
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your virtual card has been created successfully.
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
