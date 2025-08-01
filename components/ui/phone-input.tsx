"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { countries, getDefaultCountry, type Country } from "@/lib/countries-phone"

interface PhoneInputProps {
  value: string
  onChange: (fullPhoneNumber: string) => void
  onCountryChange?: (country: Country) => void
  className?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

export function PhoneInput({
  value,
  onChange,
  onCountryChange,
  className = "",
  placeholder = "Enter phone number",
  required = false,
  disabled = false
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(getDefaultCountry())
  
  // Extract phone number without country code
  const getPhoneNumberWithoutCode = (fullNumber: string, countryCode: string) => {
    if (fullNumber.startsWith(countryCode)) {
      return fullNumber.slice(countryCode.length)
    }
    return fullNumber
  }

  const phoneNumber = getPhoneNumberWithoutCode(value, selectedCountry.phoneCode)

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode) || getDefaultCountry()
    setSelectedCountry(country)
    
    // Update the full phone number with new country code
    const cleanNumber = phoneNumber.replace(/^\+/, "").replace(/^0+/, "")
    const newFullNumber = `${country.phoneCode}${cleanNumber}`
    onChange(newFullNumber)
    
    if (onCountryChange) {
      onCountryChange(country)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value
    
    // Remove any non-digits and leading zeros
    inputValue = inputValue.replace(/\D/g, "").replace(/^0+/, "")
    
    // Combine with country code
    const fullNumber = `${selectedCountry.phoneCode}${inputValue}`
    onChange(fullNumber)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="phone" className="text-navy">
        Phone Number {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex gap-2">
        <Select
          value={selectedCountry.code}
          onValueChange={handleCountryChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-32 bg-white/70 border-navy/20 focus:border-navy">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span className="text-sm">{selectedCountry.flag}</span>
                <span className="text-sm">{selectedCountry.phoneCode}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                  <span className="text-gray-500">{country.phoneCode}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Input
          id="phone"
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="flex-1 bg-white/70 border-navy/20 focus:border-navy"
        />
      </div>
      <p className="text-xs text-navy/60">
        Full number: {selectedCountry.phoneCode}{phoneNumber}
      </p>
    </div>
  )
}
