# Deployment Guide

## Vercel Deployment

### Prerequisites
1. Ensure all environment variables are set in Vercel dashboard
2. Database should be accessible from Vercel

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding`
- `GEMINI_API_KEY` - Google Gemini API key

### Deployment Steps
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Troubleshooting
- If Prisma errors occur, ensure DATABASE_URL is correct
- Check Vercel function logs for detailed error messages
- Ensure all dependencies are in package.json