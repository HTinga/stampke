'use strict';
// ── Email sender — AWAITABLE for Vercel serverless compatibility ──────────────
// Vercel freezes the process immediately after res.send() — fire-and-forget
// Promise chains get killed. This function must be AWAITED before res is sent.
const { Resend } = require('resend');
const logger     = require('./logger');

const sendEmail = async ({ to, subject, html, from = 'StampKE <noreply@tomo.ke>' }) => {
  try {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder') {
      logger.warn(`[Email] RESEND_API_KEY not set — skipping email to ${to}: ${subject}`);
      return;
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({ from, to, subject, html });
    if (error) logger.error(`[Email] Send failed to ${to}: ${JSON.stringify(error)}`);
    else       logger.info(`[Email] Sent "${subject}" to ${to} (id: ${data?.id})`);
  } catch (e) {
    logger.error(`[Email] Exception sending to ${to}: ${e.message}`);
  }
};

module.exports = sendEmail;
