import React from "react"
import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  FileText, 
  Building2, 
  Calendar, 
  DollarSign, 
  User, 
  Lock, 
  ExternalLink, 
  Printer, 
  QrCode, 
  ArrowLeft,
  Search,
  Copy,
  BadgeCheck,
  Sparkles,
  HelpCircle
} from "lucide-react"
import { verifyDocumentByToken, PublicVerificationResponse } from "@/lib/document-verification"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import QuardCubeStamp from "@/components/ui/quardcube-stamp"
import VerificationClientView from "./verification-client-view"

interface PageProps {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  const res = await verifyDocumentByToken(token)

  if (res.verified && res.documentNumber) {
    return {
      title: `${res.statusDisplay?.badgeLabel || "Verified"} Document: ${res.documentNumber} | QuardCube Labs Verification`,
      description: `Authoritative verification for QuardCube Labs ${res.documentTypeLabel || "document"} ${res.documentNumber}. Status: ${res.statusDisplay?.badgeLabel || res.status}.`
    }
  }

  return {
    title: "Document Verification | QuardCube Labs Authority",
    description: "Verify genuine commercial documents issued by QuardCube Labs Limited."
  }
}

export default async function VerifyTokenPage({ params }: PageProps) {
  const { token } = await params
  const result: PublicVerificationResponse = await verifyDocumentByToken(token)

  return <VerificationClientView token={token} initialResult={result} />
}
