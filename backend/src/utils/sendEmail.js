// #14 — Async non-blocking email sender
// Never awaited inline — fire-and-forget so slow SMTP never blocks a request
const { Resend }   = require('resend');
const logger       = require('./logger');

const sendEmail = ({ to, subject, html, from = 'Tomo <noreply@tomo.ke>' }) => {
  // Fire and forget — intentionally no await
  Promise.resolve().then(async () => {
    try {
      if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder') {
        logger.warn(`[Email] RESEND_API_KEY not set — skipping email to ${to}: ${subject}`);
        return;
      }
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({ from, to, subject, html });
      if (error) logger.error(`[Email] Send failed to ${to}: ${JSON.stringify(error)}`);
      else       logger.info(`[Email] Sent to ${to}: ${subject}`);
    } catch (e) {
      logger.error(`[Email] Exception sending to ${to}: ${e.message}`);
    }
  });
};

module.exports = sendEmail;
