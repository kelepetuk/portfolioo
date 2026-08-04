const revealItems = document.querySelectorAll('.reveal');
const typedText = document.querySelector('.typed-text');
const navToggle = document.querySelector('.nav-toggle');
const themeToggle = document.querySelector('.theme-toggle');
const modal = document.getElementById('certificate-modal');
const modalTitle = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const modalFrame = document.getElementById('modal-frame');
const modalMessage = document.getElementById('modal-message');
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');
// Change this to your server URL if the API is hosted elsewhere (include origin), e.g. 'https://example.com/contact'
const CONTACT_ENDPOINT = '/contact';

const typingWords = ['Technical Support', 'Troubleshooting', 'Windows Administration', 'Office Operations', 'Reliable Service'];
let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;

// Basic client-side sanitizer: strips tags and trims
function sanitize(input) {
  return String(input || '').replace(/<[^>]*>?/gm, '').trim();
}

function typeText() {
  if (!typedText) return;

  const currentWord = typingWords[wordIndex];
  typedText.textContent = currentWord.slice(0, charIndex);

  if (!isDeleting && charIndex < currentWord.length) {
    charIndex += 1;
    setTimeout(typeText, 90);
  } else if (!isDeleting && charIndex === currentWord.length) {
    isDeleting = true;
    setTimeout(typeText, 900);
  } else if (isDeleting && charIndex > 0) {
    charIndex -= 1;
    setTimeout(typeText, 50);
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    wordIndex = (wordIndex + 1) % typingWords.length;
    setTimeout(typeText, 900);
  }
}

function revealOnScroll() {
  revealItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80) {
      item.classList.add('visible');
    }
  });
}

function toggleMenu() {
  document.body.classList.toggle('menu-open');
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove('visible');
  modal.setAttribute('aria-hidden', 'true');
  if (modalFrame) {
    modalFrame.src = '';
  }
  if (modalMessage) {
    modalMessage.textContent = 'The uploaded certificate PDF will appear here once the file is available.';
  }
}

function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  const icon = themeToggle?.querySelector('i');
  if (icon) {
    icon.className = isLight ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }
  if (themeToggle) {
    themeToggle.setAttribute('aria-label', isLight ? 'Toggle dark mode' : 'Toggle light mode');
  }
}

function openModal(button) {
  if (!modal || !modalTitle || !modalSubtitle) return;

  const card = button.closest('.certificate-card');

  // prefer dataset values unless they are placeholder markers like "[Add ...]"
  const rawTitle = button.dataset.title || '';
  const datasetHasPlaceholder = (s) => !s || s.includes('[Add') || s.trim().startsWith('[');
  const title = !datasetHasPlaceholder(rawTitle)
    ? rawTitle
    : (card?.querySelector('.certificate-details h3')?.textContent?.trim() || 'Certificate Preview');

  const rawOrg = button.dataset.org || '';
  const org = !datasetHasPlaceholder(rawOrg)
    ? rawOrg
    : (card?.querySelectorAll('.certificate-details p')[0]?.textContent?.replace(/^[^:]+:\s*/, '').trim() || '');

  const rawDate = button.dataset.date || '';
  const date = !datasetHasPlaceholder(rawDate)
    ? rawDate
    : (card?.querySelectorAll('.certificate-details p')[1]?.textContent?.replace(/^[^:]+:\s*/, '').trim() || '');

  modalTitle.textContent = title;
  modalSubtitle.textContent = [org, date].filter(Boolean).join(' • ');

  if (modalFrame) {
    const file = button.dataset.file || '';
    modalFrame.src = file ? `${file}#view=FitH&zoom=page-width` : '';
  }
  if (modalMessage) {
    modalMessage.textContent = button.dataset.file ? 'Loading certificate preview...' : 'No certificate file is available yet.';
  }
  modal.classList.add('visible');
  modal.setAttribute('aria-hidden', 'false');
}

function getRateLimitState() {
  const storedValue = localStorage.getItem('portfolio-contact-rate-limit');
  if (!storedValue) return null;

  try {
    return JSON.parse(storedValue);
  } catch (error) {
    return null;
  }
}

function updateRateLimitState() {
  const now = Date.now();
  const state = getRateLimitState();
  const windowMs = 10 * 60 * 1000;
  const maxSubmissions = 3;

  if (!state) {
    localStorage.setItem('portfolio-contact-rate-limit', JSON.stringify({ count: 1, firstSentAt: now }));
    return true;
  }

  const elapsed = now - state.firstSentAt;
  if (elapsed >= windowMs) {
    localStorage.setItem('portfolio-contact-rate-limit', JSON.stringify({ count: 1, firstSentAt: now }));
    return true;
  }

  if (state.count >= maxSubmissions) {
    return false;
  }

  localStorage.setItem('portfolio-contact-rate-limit', JSON.stringify({ count: state.count + 1, firstSentAt: state.firstSentAt }));
  return true;
}

async function handleContactSubmit(event) {
  event.preventDefault();

  if (!contactForm || !formStatus) return;

  const rateLimitAllowed = updateRateLimitState();
  if (!rateLimitAllowed) {
    formStatus.textContent = 'Too many messages from this device. Please wait 10 minutes before trying again.';
    formStatus.className = 'form-status error';
    return;
  }

  const submitButton = contactForm.querySelector('button[type="submit"]');
  const originalButtonText = submitButton?.textContent || 'Send Message';

  formStatus.textContent = 'Sending your message...';
  formStatus.className = 'form-status';
  submitButton.disabled = true;
  submitButton.textContent = 'Sending...';

  try {
    // Honeypot check (bots will often fill this)
    const hp = contactForm.querySelector('#hp_website') || contactForm.querySelector('input[name="website"]');
    if (hp && hp.value && hp.value.trim() !== '') {
      formStatus.textContent = 'Unable to send message.';
      formStatus.className = 'form-status error';
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      return;
    }

    // Build a sanitized FormData object
    const formData = new FormData();
    const nameField = contactForm.querySelector('input[name="name"]');
    const emailField = contactForm.querySelector('input[name="email"]');
    const messageField = contactForm.querySelector('textarea[name="message"]');

    formData.append('name', sanitize(nameField?.value));
    formData.append('email', sanitize(emailField?.value));
    formData.append('message', sanitize(messageField?.value));
    // preserve hidden FormSubmit fields if present
    const subj = contactForm.querySelector('input[name="_subject"]');
    const cap = contactForm.querySelector('input[name="_captcha"]');
    if (subj) formData.append('_subject', subj.value);
    if (cap) formData.append('_captcha', cap.value);

    // Attach reCAPTCHA token if grecaptcha is available. Replace YOUR_SITE_KEY in index.html.
    try {
      if (window.grecaptcha && typeof grecaptcha.execute === 'function') {
        const SITE_KEY = 'YOUR_SITE_KEY';
        await grecaptcha.ready();
        // execute may fail if SITE_KEY is not set; catch and continue
        const token = await grecaptcha.execute(SITE_KEY, { action: 'contact' });
        if (token) {
          formData.append('g-recaptcha-response', token);
          const tokenField = document.getElementById('g-recaptcha-response');
          if (tokenField) tokenField.value = token;
        }
      }
    } catch (recErr) {
      // ignore recaptcha errors; submission will proceed without token
      console.warn('reCAPTCHA token not obtained', recErr);
    }
    const response = await fetch(CONTACT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      },
      body: formData
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || payload?.success === false) {
      const message = payload?.message || 'Unable to send message right now.';
      throw new Error(message);
    }

    formStatus.textContent = 'Thank you! Your message has been sent successfully.';
    formStatus.classList.add('success');
    contactForm.reset();
  } catch (error) {
    const message = error.message || 'Sorry, something went wrong. Please try again later.';
    formStatus.textContent = message;
    formStatus.classList.add('error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
}

window.addEventListener('load', () => {
  typeText();
  revealOnScroll();
});

window.addEventListener('scroll', revealOnScroll);
window.addEventListener('resize', () => {
  if (window.innerWidth > 720) {
    document.body.classList.remove('menu-open');
  }
});

navToggle?.addEventListener('click', toggleMenu);
themeToggle?.addEventListener('click', toggleTheme);

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    document.body.classList.remove('menu-open');
  });
});

contactForm?.addEventListener('submit', handleContactSubmit);

document.querySelectorAll('[data-cert]').forEach((button) => {
  button.addEventListener('click', () => openModal(button));
});

modal?.addEventListener('click', (event) => {
  if (event.target === modal || event.target.classList.contains('modal-close')) {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
});
