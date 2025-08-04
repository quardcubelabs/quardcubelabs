# Clerk Setup Guide

This application uses Clerk for user authentication and management. Follow these steps to set up Clerk:

## 1. Create a Clerk Account

1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Sign up for a free account or log in if you already have one

## 2. Create a New Application

1. Click "Add application" in your Clerk dashboard
2. Choose your preferred sign-in methods (Email, Phone, Social logins)
3. Give your application a name (e.g., "QuardCube Labs")

## 3. Get Your API Keys

After creating your application:

1. Go to "API Keys" in your Clerk dashboard
2. Copy the **Publishable Key** and **Secret Key**

## 4. Update Environment Variables

Uncomment and replace the placeholder values in your `.env.local` file:

```env
# Uncomment and replace these with your actual Clerk keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_actual_secret_key_here
```

**Important**: Make sure to use your actual keys from Clerk dashboard, not the placeholder values.

## 5. Verify Your Keys

Your Clerk keys should look like this:
- **Publishable Key**: Starts with `pk_test_` or `pk_live_`
- **Secret Key**: Starts with `sk_test_` or `sk_live_`

## 6. Optional Configuration

You can customize the authentication URLs (if needed):

```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

## 7. Test the Setup

1. Restart your development server: `npm run dev`
2. Try accessing the admin users page at `/admin/users`
3. The application should now work with real Clerk users

## Fallback Mode

If Clerk is not configured, the application will automatically fall back to mock data, so the users page will still work for development purposes.

## Troubleshooting

- Make sure your `.env.local` file is in the root directory
- **Remove placeholder values** - Comment out or delete lines with placeholder keys
- Restart your development server after updating environment variables
- Check that your Clerk keys are correctly copied (no extra spaces)
- Verify your Clerk application is active in the dashboard
- Make sure your secret key starts with `sk_test_` or `sk_live_`

## Common Issues

### "Unauthorized" Error
- This means your Clerk secret key is invalid or expired
- Go to your Clerk dashboard and regenerate your secret key
- Make sure you're using the secret key, not the publishable key

### Application Still Shows Mock Data
- Verify your environment variables are uncommented in `.env.local`
- Check that there are no typos in your environment variable names
- Restart your development server after making changes

## Features Available with Clerk

Once configured, you'll have access to:
- Real user management
- Role-based access control
- User status management (active/inactive/suspended)
- Email and phone verification status
- User analytics and statistics
- Order history integration
