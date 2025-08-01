export interface Country {
  code: string
  name: string
  phoneCode: string
  flag: string
}

export const countries: Country[] = [
  { code: "TZ", name: "Tanzania", phoneCode: "+255", flag: "🇹🇿" },
  { code: "KE", name: "Kenya", phoneCode: "+254", flag: "🇰🇪" },
  { code: "UG", name: "Uganda", phoneCode: "+256", flag: "🇺🇬" },
  { code: "RW", name: "Rwanda", phoneCode: "+250", flag: "🇷🇼" },
  { code: "BI", name: "Burundi", phoneCode: "+257", flag: "🇧🇮" },
  { code: "ZA", name: "South Africa", phoneCode: "+27", flag: "🇿🇦" },
  { code: "NG", name: "Nigeria", phoneCode: "+234", flag: "🇳🇬" },
  { code: "GH", name: "Ghana", phoneCode: "+233", flag: "🇬🇭" },
  { code: "EG", name: "Egypt", phoneCode: "+20", flag: "🇪🇬" },
  { code: "MA", name: "Morocco", phoneCode: "+212", flag: "🇲🇦" },
  { code: "US", name: "United States", phoneCode: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", phoneCode: "+44", flag: "🇬🇧" },
  { code: "CA", name: "Canada", phoneCode: "+1", flag: "🇨🇦" },
  { code: "AU", name: "Australia", phoneCode: "+61", flag: "🇦🇺" },
  { code: "IN", name: "India", phoneCode: "+91", flag: "🇮🇳" },
  { code: "CN", name: "China", phoneCode: "+86", flag: "🇨🇳" },
  { code: "JP", name: "Japan", phoneCode: "+81", flag: "🇯🇵" },
  { code: "DE", name: "Germany", phoneCode: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", phoneCode: "+33", flag: "🇫🇷" },
  { code: "IT", name: "Italy", phoneCode: "+39", flag: "🇮🇹" },
  { code: "ES", name: "Spain", phoneCode: "+34", flag: "🇪🇸" },
  { code: "BR", name: "Brazil", phoneCode: "+55", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", phoneCode: "+52", flag: "🇲🇽" },
  { code: "AR", name: "Argentina", phoneCode: "+54", flag: "🇦🇷" },
  { code: "AE", name: "United Arab Emirates", phoneCode: "+971", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", phoneCode: "+966", flag: "🇸🇦" },
]

// Default to Tanzania for East African focus
export const getDefaultCountry = (): Country => {
  return countries.find(country => country.code === "TZ") || countries[0]
}
