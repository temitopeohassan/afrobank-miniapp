"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Wifi, Loader2, Check, X } from "lucide-react"
import { topupAPI } from "@/lib/api"
import { useAccount, useWalletClient, usePublicClient, useConnect } from "wagmi"
import { parseUnits, formatUnits } from "viem"
import { injected } from 'wagmi/connectors'
import { PAYMENTPROCESSOR_ABI, PAYMENTPROCESSOR_ADDRESS, USDC_ADDRESS } from "@/app/constants/PaymentProcessorAbi"
import { config } from "@/app/config"

export default function BuyDataPage() {
  const [amount, setAmount] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [selectedOperator, setSelectedOperator] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [operators, setOperators] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [operatorsLoading, setOperatorsLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(false)
  
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
    loadOperators()
  }, [])

  useEffect(() => {
    if (selectedOperator) {
      loadProducts()
    }
  }, [selectedOperator])

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

  // Calculate USDC amount when product changes
  useEffect(() => {
    if (selectedProduct) {
      const selectedProductData = products.find((p: any) => p.id === selectedProduct)
      if (selectedProductData?.price) {
        // Convert NGN to USD (approximate rate, you can use real-time rates)
        const ngnAmount = selectedProductData.price
        const usdValue = ngnAmount / 1500 // Approximate NGN to USD rate
        setUsdcAmount(usdValue)
      } else {
        setUsdcAmount(0)
      }
    } else {
      setUsdcAmount(0)
    }
  }, [selectedProduct, products])

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

  const loadProducts = async () => {
    if (!selectedOperator) return
    
    try {
      setProductsLoading(true)
      const response = await topupAPI.getOperatorProducts(selectedOperator, { size: 50 })
      if (response && typeof response === 'object' && 'success' in response && response.success) {
        setProducts((response as any).data?.content || [])
      }
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setProductsLoading(false)
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

  const handleBuyNow = async () => {
    if (!selectedProduct || !phoneNumber) {
      alert('Please fill in all required fields')
      return
    }

    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    setShowConfirmModal(true)
  }

  const handleConfirmedPurchase = async () => {
    try {
      setLoading(true)
      setShowConfirmModal(false)

      // First, process blockchain payment
      const txHash = await initiateBlockchainPayment()

      // If blockchain payment is successful, proceed with data bundle purchase
      if (txHash) {
        setTransactionStatus("Processing data bundle purchase...")
        const selectedProductData = products.find((p: any) => p.id === selectedProduct)
        
        const response = await topupAPI.sendTopup({
          operatorId: selectedOperator,
          amount: selectedProductData?.price || 0,
          useLocalAmount: true,
          recipientPhoneNumber: phoneNumber,
          reference: `data-${Date.now()}`,
          // Note: blockchainTxHash and paymentId are stored locally for reference
          // but not sent to the API as they're not part of the expected payload
        })
        
        if (response && typeof response === 'object' && 'success' in response && response.success) {
          setShowSuccessModal(true)
          // Reset form
          setSelectedProduct("")
          setPhoneNumber("")
          setSelectedOperator("")
          setPaymentId(null)
        }
      }
    } catch (error) {
      console.error('Failed to process data bundle purchase:', error)
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
    setSelectedProduct("")
    setPhoneNumber("")
    setSelectedOperator("")
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
          <h1 className="text-lg font-semibold">Buy Data</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <Wifi className="w-8 h-8 text-accent-foreground" />
            </div>
            <CardTitle className="text-xl">Purchase Data Bundle</CardTitle>
            <p className="text-muted-foreground text-sm">Enter the amount for your data bundle</p>
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
                    <SelectItem value="loading" disabled>
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

            {/* Data Product Selection */}
            {selectedOperator && (
              <div className="space-y-2">
                <Label htmlFor="product">Data Bundle</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data bundle" />
                  </SelectTrigger>
                  <SelectContent>
                    {productsLoading ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading bundles...
                        </div>
                      </SelectItem>
                    ) : (
                      products.map((product: any) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - ₦{product.price}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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
              onClick={handleBuyNow}
              disabled={!selectedProduct || !phoneNumber || !selectedOperator || loading || !isConnected}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </div>
              ) : !isConnected ? (
                'Connect Wallet to Buy'
              ) : (
                'Buy Data Bundle'
              )}
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Please confirm the details of your data bundle purchase:
            </p>
            <div className="space-y-2 mb-6">
              <p className="text-center dark:text-white">
                <span className="font-bold">Operator:</span> {operators.find((op: any) => op.id === selectedOperator)?.name || 'N/A'}
              </p>
              <p className="text-center dark:text-white">
                <span className="font-bold">Bundle:</span> {products.find((p: any) => p.id === selectedProduct)?.name || 'N/A'}
              </p>
              <p className="text-center dark:text-white">
                <span className="font-bold">Price:</span> ₦{products.find((p: any) => p.id === selectedProduct)?.price || 'N/A'}
              </p>
              <p className="text-center dark:text-white">
                <span className="font-bold">USDC Value:</span> ${usdcAmount.toFixed(2)}
              </p>
              <p className="text-center dark:text-white">
                <span className="font-bold">Phone Number:</span> {phoneNumber}
              </p>
            </div>
            {transactionStatus && (
              <p className="text-blue-500 text-center mb-4">{transactionStatus}</p>
            )}
            <div className="flex justify-end space-x-4">
              <Button variant="ghost" onClick={() => setShowConfirmModal(false)} disabled={loading}>
                Edit
              </Button>
              <Button onClick={handleConfirmedPurchase} disabled={loading}>
                {loading ? "Processing..." : "Confirm Purchase"}
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
                Purchase Failed
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
                Data Bundle Purchase Successful
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your data bundle has been purchased successfully.
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
