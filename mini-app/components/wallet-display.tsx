"use client"

import { useAccount, useConnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Wallet, Copy, Check } from 'lucide-react'
import { useState } from 'react'

export function WalletDisplay() {
  const { isConnected, address } = useAccount()
  const { connect, connectors } = useConnect()
  const [copied, setCopied] = useState(false)

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <Wallet className="w-4 h-4 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-card-foreground">Connected</p>
          <p className="text-xs text-muted-foreground font-mono">
            {truncateAddress(address)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyAddress}
          className="h-8 w-8 p-0"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={() => connect({ connector: connectors[0] })}
      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
    >
      <Wallet className="w-4 h-4 mr-2" />
      Connect Wallet
    </Button>
  )
}
