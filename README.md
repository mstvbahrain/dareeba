# Dareeba

Dareeba is a full-stack MVP for Bahrain VAT document checks. Users upload invoices, receipts, import documents, CSV, or Excel files, confirm extracted data, receive an AI-assisted VAT estimate, unlock paid reports, and request review from a Bahrain VAT/accounting partner.

The app deliberately uses estimate-oriented wording throughout. It does not present results as final tax, legal, or accounting advice.

## Tech Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- PostgreSQL + Prisma
- Stripe Checkout
- OpenAI API for optional AI analysis
- PDFKit PDF reports
- ExcelJS Excel exports
- Nodemailer partner notifications

## Local Setup

1. Install Node.js 20 or newer from `https://nodejs.org`.

2. Open Terminal and go to the project folder:

```bash
cd "/Users/shaji/Documents/Dareeba"
```

3. Install dependencies:

```bash
npm install
```

4. Create your local environment file:

```bash
cp .env.example .env
```

5. Set `DATABASE_URL` in `.env` to a PostgreSQL database. For a local Docker database, you can use:

```bash
docker run --name dareeba-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=dareeba \
  -p 5432:5432 \
  -d postgres:16
```

6. Create the database tables and seed the starter VAT rules/pricing:

```bash
npm run prisma:migrate
npm run prisma:seed
```

7. Start the local website:

```bash
npm run dev
```

8. Open:

```text
http://localhost:3000
```

## Environment Variables

Required:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dareeba"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ADMIN_USER="admin"
ADMIN_PASSWORD="change-me"
```

Optional:

```bash
UPLOAD_DIR=""
OPENAI_API_KEY=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
PARTNER_EMAIL="partner@example.com"
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="Dareeba <no-reply@example.com>"
RATE_LIMIT_WINDOW_MS="60000"
RATE_LIMIT_MAX="30"
```

`OPENAI_API_KEY` is optional. When it is not set, Dareeba uses fallback VAT classification based on the configured rule examples.

Stripe variables are optional for local testing. If `STRIPE_SECRET_KEY` is missing, the checkout API marks the report as paid so the MVP can be tested without live payments.

SMTP variables are optional. If they are missing, referral leads are still saved in the database, but no partner email is sent.

## Verify Before Deployment

Run these commands before pushing:

```bash
npm install
npm run build
```

Both commands should complete successfully.

## Push To GitHub

1. Create a new empty repository on GitHub. Do not add a README from GitHub because this project already has one.

2. In Terminal, from the project folder:

```bash
git init
git add .
git commit -m "Initial Dareeba MVP"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/dareeba.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username.

Do not commit `.env`; it is ignored by `.gitignore`.

## Deploy On Vercel

1. Go to `https://vercel.com`.
2. Click `Add New Project`.
3. Import the GitHub repository you just pushed.
4. Keep the framework preset as `Next.js`.
5. Add a PostgreSQL database. Good beginner options are Vercel Postgres/Neon, Supabase, or Railway.
6. Copy the production PostgreSQL connection string into Vercel as `DATABASE_URL`.
7. Add these required Vercel environment variables:

```bash
DATABASE_URL="your-production-postgres-url"
NEXT_PUBLIC_APP_URL="https://your-vercel-domain.vercel.app"
ADMIN_USER="choose-an-admin-username"
ADMIN_PASSWORD="choose-a-strong-password"
```

8. Add optional production variables when ready:

```bash
OPENAI_API_KEY="your-openai-key"
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
PARTNER_EMAIL="partner@example.com"
SMTP_HOST="your-smtp-host"
SMTP_PORT="587"
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
SMTP_FROM="Dareeba <no-reply@yourdomain.com>"
RATE_LIMIT_WINDOW_MS="60000"
RATE_LIMIT_MAX="30"
```

9. Deploy the project.

10. After the first deploy, run the database migration and seed commands from your computer with the production `DATABASE_URL`:

```bash
DATABASE_URL="your-production-postgres-url" npm run prisma:deploy
DATABASE_URL="your-production-postgres-url" npm run prisma:seed
```

11. If using Stripe, add this webhook endpoint in Stripe:

```text
https://your-vercel-domain.vercel.app/api/payments/webhook
```

Subscribe it to:

```text
checkout.session.completed
```

Then copy the webhook signing secret into Vercel as `STRIPE_WEBHOOK_SECRET`.

## Production Note About Uploads

This MVP stores uploaded files temporarily. On Vercel, the app writes uploads to `/tmp`, which is not permanent storage. For real customer use, replace this with private object storage such as Vercel Blob, S3, Cloudflare R2, or Supabase Storage.

## Disclaimer

This platform provides AI-generated VAT estimates for informational purposes only. It does not provide legal, tax, or accounting advice. Final VAT treatment should be confirmed by a qualified Bahrain VAT professional or the National Bureau for Revenue guidance.
