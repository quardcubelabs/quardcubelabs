"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { FileText, Download, Send, Star, Package } from "lucide-react"
import { Product } from "@/types/database"
import Image from "next/image"

interface QuoteContentProps {
  product: Product
}

export default function QuoteContent({ product }: QuoteContentProps) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [quoteData, setQuoteData] = useState({
    companyName: '',
    contactPerson: user?.user_metadata?.name || user?.email?.split('@')[0] || '',
    email: user?.email || '',
    phone: '',
    projectDescription: '',
    timeline: '',
    budget: '',
    requirements: '',
    additionalNotes: ''
  })

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    router.push("/auth/login")
    return null
  }

  const handleInputChange = (field: string, value: string) => {
    setQuoteData(prev => ({ ...prev, [field]: value }))
  }

  const generateQuotePDF = () => {
    const quoteContent = `
      QUOTATION REQUEST
      ===================
      
      Service: ${product.name}
      Base Price: TZS ${product.price.toLocaleString()}
      
      Client Information:
      -------------------
      Company: ${quoteData.companyName}
      Contact Person: ${quoteData.contactPerson}
      Email: ${quoteData.email}
      Phone: ${quoteData.phone}
      
      Project Details:
      ----------------
      Description: ${quoteData.projectDescription}
      Timeline: ${quoteData.timeline}
      Budget Range: ${quoteData.budget}
      
      Requirements:
      -------------
      ${quoteData.requirements}
      
      Additional Notes:
      -----------------
      ${quoteData.additionalNotes}
      
      Service Features:
      -----------------
      ${product.features.map(feature => `• ${feature}`).join('\n')}
      
      ---
      Generated on: ${new Date().toLocaleDateString()}
      QuardCubeLabs - Innovative IT Solutions
    `

    const blob = new Blob([quoteContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${product.name.replace(/\s+/g, '_')}_Quote_Request.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleSubmitQuote = async () => {
    if (!quoteData.contactPerson || !quoteData.email || !quoteData.projectDescription) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      // Generate and download the quote
      generateQuotePDF()
      
      // Send WhatsApp notification to admin about new quote request
      try {
        await fetch('/api/whatsapp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'quote',
            data: {
              customerName: quoteData.contactPerson,
              customerEmail: quoteData.email,
              serviceName: product.name,
              projectDescription: quoteData.projectDescription,
              budget: quoteData.budget,
            },
          }),
        })
      } catch (whatsappError) {
        console.error("Failed to send WhatsApp quote notification:", whatsappError)
        // Don't fail the quote generation if WhatsApp fails
      }
      
      toast({
        title: "Quote Generated Successfully!",
        description: "Your quote request has been generated and downloaded. Our team will contact you soon.",
        duration: 5000,
      })

      // Optionally send quote request to admin/database
      // await sendQuoteRequest(quoteData, product)
      
    } catch (error) {
      console.error("Error generating quote:", error)
      toast({
        title: "Error generating quote",
        description: "There was an error generating your quote. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Service Details */}
        <div className="lg:col-span-1">
          <Card className="border-navy/20 sticky top-32">
            <CardHeader>
              <CardTitle className="text-navy flex items-center gap-2">
                <Package className="h-5 w-5" />
                Service Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    width={200}
                    height={150}
                    className="rounded-lg object-cover mx-auto"
                  />
                </div>
                
                <div>
                  <h3 className="font-bold text-lg text-navy">{product.name}</h3>
                  <Badge className="bg-brand-red text-white mt-2">{product.category}</Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm">{product.rating} rating</span>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-2">Base Price:</p>
                  <p className="text-2xl font-bold text-navy">
                    TZS {product.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">*Final price may vary based on requirements</p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold text-navy mb-2">Included Features:</h4>
                  <ul className="space-y-1">
                    {product.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quote Form */}
        <div className="lg:col-span-2">
          <Card className="border-navy/20">
            <CardHeader>
              <CardTitle className="text-navy flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Request Quote
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={quoteData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      className="border-navy/20 focus:border-navy"
                      placeholder="Your company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">Contact Person *</Label>
                    <Input
                      id="contactPerson"
                      value={quoteData.contactPerson}
                      onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                      className="border-navy/20 focus:border-navy"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={quoteData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="border-navy/20 focus:border-navy"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={quoteData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="border-navy/20 focus:border-navy"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="projectDescription">Project Description *</Label>
                  <Textarea
                    id="projectDescription"
                    value={quoteData.projectDescription}
                    onChange={(e) => handleInputChange('projectDescription', e.target.value)}
                    className="border-navy/20 focus:border-navy"
                    rows={4}
                    placeholder="Describe your project requirements in detail..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timeline">Project Timeline</Label>
                    <Input
                      id="timeline"
                      value={quoteData.timeline}
                      onChange={(e) => handleInputChange('timeline', e.target.value)}
                      className="border-navy/20 focus:border-navy"
                      placeholder="e.g., 2-3 months"
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget">Budget Range</Label>
                    <Input
                      id="budget"
                      value={quoteData.budget}
                      onChange={(e) => handleInputChange('budget', e.target.value)}
                      className="border-navy/20 focus:border-navy"
                      placeholder="e.g., TZS 1,000,000 - 2,000,000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="requirements">Specific Requirements</Label>
                  <Textarea
                    id="requirements"
                    value={quoteData.requirements}
                    onChange={(e) => handleInputChange('requirements', e.target.value)}
                    className="border-navy/20 focus:border-navy"
                    rows={3}
                    placeholder="Any specific technical requirements, platforms, integrations, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="additionalNotes">Additional Notes</Label>
                  <Textarea
                    id="additionalNotes"
                    value={quoteData.additionalNotes}
                    onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                    className="border-navy/20 focus:border-navy"
                    rows={3}
                    placeholder="Any additional information or special requests..."
                  />
                </div>

                <div className="space-y-3 pt-4">
                  <Button
                    onClick={handleSubmitQuote}
                    disabled={isGenerating || authLoading}
                    className="w-full bg-navy hover:bg-brand-red text-white py-3"
                    size="lg"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    {isGenerating ? "Generating Quote..." : "Generate & Download Quote"}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => router.push("/shop")}
                    className="w-full border-navy/20 text-navy hover:bg-navy hover:text-white"
                  >
                    Back to Shop
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}