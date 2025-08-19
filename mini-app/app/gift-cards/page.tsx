"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Gift, Loader2, Search, Filter } from "lucide-react"
import { giftCardAPI } from "@/lib/api"

export default function GiftCardsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedBrand, setSelectedBrand] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [productsLoading, setProductsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedCategory || selectedBrand || searchQuery) {
      setCurrentPage(1)
      loadProducts(true)
    } else {
      loadProducts()
    }
  }, [selectedCategory, selectedBrand, searchQuery])

  const loadInitialData = async () => {
    try {
      const [categoriesResponse, brandsResponse] = await Promise.all([
        giftCardAPI.getCategories(),
        giftCardAPI.getBrands({ size: 100 })
      ])

      if (categoriesResponse && typeof categoriesResponse === 'object' && 'success' in categoriesResponse && categoriesResponse.success) {
        setCategories((categoriesResponse as any).data || [])
      }
      
      if (brandsResponse && typeof brandsResponse === 'object' && 'success' in brandsResponse && brandsResponse.success) {
        setBrands((brandsResponse as any).data || [])
      }
    } catch (error) {
      console.error('Failed to load initial data:', error)
    }
  }

  const loadProducts = async (reset = false) => {
    try {
      setProductsLoading(true)
      const params: any = {
        page: reset ? 1 : currentPage,
        size: 20
      }
      
      if (selectedCategory) params.categoryId = selectedCategory
      if (selectedBrand) params.brandId = selectedBrand
      
      const response = await giftCardAPI.getProducts(params)
      
      if (response && typeof response === 'object' && 'success' in response && response.success) {
        const newProducts = (response as any).data?.content || []
        if (reset) {
          setProducts(newProducts)
        } else {
          setProducts(prev => [...prev, ...newProducts])
        }
        
        setHasMore(newProducts.length === 20)
        if (!reset) {
          setCurrentPage(prev => prev + 1)
        }
      }
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setProductsLoading(false)
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setCurrentPage(1)
      loadProducts(true)
    }
  }

  const clearFilters = () => {
    setSelectedCategory("")
    setSelectedBrand("")
    setSearchQuery("")
    setCurrentPage(1)
    setProducts([])
    loadProducts()
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(price)
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
          <h1 className="text-lg font-semibold">Gift Cards</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-6">
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          {/* Search Bar */}
          <div className="relative">
            <Input
              placeholder="Search gift cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pr-10"
            />
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-0 top-0 h-full px-3"
              onClick={handleSearch}
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Brands</SelectItem>
                {brands.map((brand: any) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {(selectedCategory || selectedBrand || searchQuery) && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Products Grid */}
        {productsLoading && products.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Loading gift cards...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No gift cards found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {products.map((product: any) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-accent rounded-lg mb-3 flex items-center justify-center">
                      <Gift className="w-8 h-8 text-accent-foreground" />
                    </div>
                    <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{product.brand?.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">
                        {formatPrice(product.price, product.currency)}
                      </span>
                      <Button size="sm" className="h-7 px-2 text-xs">
                        Buy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <Button
                variant="outline"
                onClick={() => loadProducts()}
                disabled={productsLoading}
                className="w-full"
              >
                {productsLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  'Load More'
                )}
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
