# Portfolio Contact Server (example)

This is a minimal Node/Express example that verifies Google reCAPTCHA v3 tokens, validates and sanitizes inputs, rate-limits contact submissions, and forwards messages via SMTP (nodemailer).

Setup

1. Copy `.env.example` to `.env` and fill in real values: `RECAPTCHA_SECRET`, SMTP credentials, and `EMAIL_TO`.

2. Install dependencies and run:

```bash
cd server
npm install
npm start
```

3. Point your contact form `action` to the server's `/contact` endpoint (or update client JS to `fetch('/contact')`). Ensure the client includes the `g-recaptcha-response` token.

Notes

- This example uses `express-rate-limit` to limit abusive requests.
- Server checks reCAPTCHA server-side; for v3 it also examines `score` and rejects low scores.
- Use parameterized queries when saving to a database (example commented in `index.js`).
- For production, run behind HTTPS, enable proper security headers (helmet used), and keep secrets out of source control.
