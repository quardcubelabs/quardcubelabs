-- Table for storing all system settings as a single JSONB row
CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY,
  settings JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings row if not exists
INSERT INTO system_settings (id, settings)
VALUES ('main', '{
  "general": {
    "siteName": "QuardCube Labs",
    "siteDescription": "Premium technology solutions and innovative services for modern businesses",
    "contactEmail": "info@quardcubelabs.com",
    "supportEmail": "support@quardcubelabs.com",
    "timezone": "UTC",
    "language": "en",
    "currency": "USD"
  },
  "appearance": {
    "theme": "light",
    "primaryColor": "#1e40af",
    "logoUrl": "/logo.svg",
    "faviconUrl": "/favicon.ico",
    "customCSS": ""
  },
  "notifications": {
    "orderNotifications": true,
    "lowStockAlerts": true,
    "userRegistration": false,
    "paymentAlerts": true,
    "systemUpdates": true,
    "emailDigest": false
  },
  "security": {
    "twoFactorAuth": false,
    "sessionTimeout": true,
    "timeoutDuration": 30,
    "maxLoginAttempts": 5,
    "passwordMinLength": 8,
    "requireStrongPassword": true
  },
  "payment": {
    "stripeEnabled": true,
    "paypalEnabled": true,
    "vodacomEnabled": true,
    "testMode": false,
    "currency": "USD",
    "taxRate": 0.15
  },
  "email": {
    "provider": "smtp",
    "smtpHost": "smtp.gmail.com",
    "smtpPort": 587,
    "smtpUser": "noreply@quardcubelabs.com",
    "smtpSecure": true,
    "fromName": "QuardCube Labs",
    "fromEmail": "noreply@quardcubelabs.com"
  }
}')
ON CONFLICT (id) DO NOTHING;
