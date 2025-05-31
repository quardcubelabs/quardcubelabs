import { CheckIcon } from "lucide-react"

export default function Check({ className = "h-12 w-12 text-green-600" }: { className?: string }) {
  return <CheckIcon className={className} />
}
