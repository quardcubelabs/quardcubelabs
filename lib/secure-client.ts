"use client"

import { decryptData, encryptData } from "@/lib/crypto-vault"

export interface SecureFetchOptions extends RequestInit {
  encryptBody?: boolean
}

export interface SecureApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  encrypted?: boolean
  meta?: any
}

/**
 * Secure client-side fetch wrapper.
 * Automatically decrypts incoming AES-256-GCM encrypted responses
 * and transparently formats them for React state consumption.
 */
export async function secureFetch<T = any>(
  url: string,
  options: SecureFetchOptions = {}
): Promise<SecureApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-Secure-Vault": "aes-256-gcm",
      ...(options.headers as Record<string, string>),
    }

    let body = options.body

    // Optional client-side payload encryption for sensitive POST/PUT bodies
    if (options.encryptBody && body && typeof body === "object") {
      headers["Content-Type"] = "application/json"
      const encryptedPayload = await encryptData(body)
      body = JSON.stringify({ encrypted: true, payload: encryptedPayload })
    }

    const res = await fetch(url, {
      ...options,
      headers,
      body,
    })

    const rawText = await res.text()

    if (!rawText || !rawText.trim()) {
      return {
        success: false,
        error: "Empty server response received.",
      }
    }

    let json: any
    try {
      json = JSON.parse(rawText)
    } catch {
      // If server returned HTML (e.g. error page or redirect)
      return {
        success: false,
        error: `Invalid server response (${res.status}): ${rawText.substring(0, 120)}`,
      }
    }

    if (!res.ok) {
      return {
        success: false,
        error: json?.error || `Request failed with status ${res.status}`,
      }
    }

    // Transparently decrypt if payload is encrypted with AES-256-GCM
    if (json.encrypted && json.payload) {
      try {
        const decrypted = await decryptData<T>(json.payload)
        return {
          success: true,
          data: decrypted,
          encrypted: true,
          meta: json.meta,
        }
      } catch (decryptErr: any) {
        console.error("Payload decryption error:", decryptErr)
        return {
          success: false,
          error: "Failed to decrypt secure API payload",
        }
      }
    }

    return json
  } catch (networkErr: any) {
    console.error("Secure fetch network error:", networkErr)
    return {
      success: false,
      error: networkErr.message || "Network connection error",
    }
  }
}
