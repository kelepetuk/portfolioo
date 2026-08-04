const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// CORS: restrict to a specific origin in production. Set CLIENT_ORIGIN env to your GitHub Pages URL.
const clientOrigin = process.env.CLIENT_ORIGIN || '';
if (clientOrigin) {
  app.use(cors({ origin: clientOrigin }));
} else {
  // no origin configured — allow all (development)
  app.use(cors());
}

const PORT = process.env.PORT || 3000;

// Gentle rate limiter for contact submissions (per IP)
const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 6, // limit each IP to 6 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

// Basic server-side validation helpers
function isEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function sanitize(s) {
  return String(s || '').replace(/<[^>]*>?/gm, '').trim();
}

// POST /contact
app.post('/contact', contactLimiter, async (req, res) => {
  try {
    const name = sanitize(req.body.name);
    const email = sanitize(req.body.email);
    const message = sanitize(req.body.message);
    const token = req.body['g-recaptcha-response'] || req.body['g-recaptcha-token'] || '';

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    if (!isEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }

    // Verify reCAPTCHA v3 token with Google
    if (!process.env.RECAPTCHA_SECRET) {
      console.warn('RECAPTCHA_SECRET not set; skipping server-side verification.');
    } else {
      const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;
      const params = new URLSearchParams();
      params.append('secret', process.env.RECAPTCHA_SECRET);
      params.append('response', token);

      const r = await axios.post(verifyUrl, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const data = r.data;
      if (!data.success) {
        return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed.' });
      }

      // For v3, check score threshold (0.0 - 1.0)
      if (typeof data.score === 'number' && data.score < 0.45) {
        return res.status(400).json({ success: false, message: 'reCAPTCHA score too low.' });
      }
    }

    // Send email via nodemailer
    if (!process.env.SMTP_HOST) {
      console.warn('SMTP_HOST not set; skipping sending email. Logging instead.');
      console.log('Contact submission:', { name, email, message });
    } else {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: process.env.EMAIL_TO,
        subject: `New contact from portfolio: ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`
      };

      await transporter.sendMail(mailOptions);
    }

    // Example: parameterized DB insert (pseudo-code)
    // const { rows } = await db.query('INSERT INTO contacts(name,email,message) VALUES($1,$2,$3) RETURNING id', [name, email, message]);

    return res.json({ success: true, message: 'Message received.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/', (req, res) => res.send('Portfolio contact server running.'));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
