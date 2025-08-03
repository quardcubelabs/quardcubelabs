"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { createApplication } from "@/lib/applications-actions"
import { Upload, Calendar, DollarSign, MapPin, User, Mail, Phone, Globe, FileText } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ApplicationFormProps {
  positionId: string
  positionTitle: string
  children: React.ReactNode
}

interface ApplicationFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  location: string
  linkedin_url: string
  portfolio_url: string
  cover_letter: string
  experience_years: number
  current_salary: string
  expected_salary: string
  availability_date: string
}

export default function ApplicationForm({ positionId, positionTitle, children }: ApplicationFormProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<ApplicationFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    location: '',
    linkedin_url: '',
    portfolio_url: '',
    cover_letter: '',
    experience_years: 0,
    current_salary: '',
    expected_salary: '',
    availability_date: ''
  })

  const handleInputChange = (field: keyof ApplicationFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Basic validation
      if (!formData.first_name || !formData.last_name || !formData.email) {
        toast({
          title: "Missing Required Fields",
          description: "Please fill in all required fields (marked with *)",
          variant: "destructive"
        })
        return
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address",
          variant: "destructive"
        })
        return
      }

      const applicationData = {
        position_id: positionId,
        ...formData,
        status: 'pending' as const
      }

      const result = await createApplication(applicationData)

      if (result.error) {
        toast({
          title: "Application Failed",
          description: result.error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Application Submitted!",
          description: "Thank you for your application. We'll review it and get back to you soon.",
        })
        setIsOpen(false)
        // Reset form
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          location: '',
          linkedin_url: '',
          portfolio_url: '',
          cover_letter: '',
          experience_years: 0,
          current_salary: '',
          expected_salary: '',
          availability_date: ''
        })
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      toast({
        title: "Application Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Apply for {positionTitle}</DialogTitle>
          <DialogDescription>
            Fill out the form below to submit your application. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="location">Current Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, Country"
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
              <div>
                <Label htmlFor="portfolio_url">Portfolio/Website</Label>
                <Input
                  id="portfolio_url"
                  type="url"
                  value={formData.portfolio_url}
                  onChange={(e) => handleInputChange('portfolio_url', e.target.value)}
                  placeholder="https://yourportfolio.com"
                />
              </div>
              <div>
                <Label htmlFor="experience_years">Years of Experience</Label>
                <Select onValueChange={(value) => handleInputChange('experience_years', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Less than 1 year</SelectItem>
                    <SelectItem value="1">1-2 years</SelectItem>
                    <SelectItem value="3">3-5 years</SelectItem>
                    <SelectItem value="6">6-10 years</SelectItem>
                    <SelectItem value="11">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="availability_date">Available Start Date</Label>
                <Input
                  id="availability_date"
                  type="date"
                  value={formData.availability_date}
                  onChange={(e) => handleInputChange('availability_date', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Compensation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Compensation
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="current_salary">Current Salary Range</Label>
                <Select onValueChange={(value) => handleInputChange('current_salary', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select current salary range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Under $30,000">Under $30,000</SelectItem>
                    <SelectItem value="$30,000 - $40,000">$30,000 - $40,000</SelectItem>
                    <SelectItem value="$40,000 - $50,000">$40,000 - $50,000</SelectItem>
                    <SelectItem value="$50,000 - $60,000">$50,000 - $60,000</SelectItem>
                    <SelectItem value="$60,000 - $80,000">$60,000 - $80,000</SelectItem>
                    <SelectItem value="$80,000 - $100,000">$80,000 - $100,000</SelectItem>
                    <SelectItem value="Over $100,000">Over $100,000</SelectItem>
                    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="expected_salary">Expected Salary Range</Label>
                <Select onValueChange={(value) => handleInputChange('expected_salary', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select expected salary range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Under $30,000">Under $30,000</SelectItem>
                    <SelectItem value="$30,000 - $40,000">$30,000 - $40,000</SelectItem>
                    <SelectItem value="$40,000 - $50,000">$40,000 - $50,000</SelectItem>
                    <SelectItem value="$50,000 - $60,000">$50,000 - $60,000</SelectItem>
                    <SelectItem value="$60,000 - $80,000">$60,000 - $80,000</SelectItem>
                    <SelectItem value="$80,000 - $100,000">$80,000 - $100,000</SelectItem>
                    <SelectItem value="Over $100,000">Over $100,000</SelectItem>
                    <SelectItem value="Negotiable">Negotiable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Cover Letter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Cover Letter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="cover_letter">Why are you interested in this position?</Label>
              <Textarea
                id="cover_letter"
                value={formData.cover_letter}
                onChange={(e) => handleInputChange('cover_letter', e.target.value)}
                placeholder="Tell us about your interest in this role and why you'd be a great fit..."
                rows={6}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-navy hover:bg-navy/90"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
