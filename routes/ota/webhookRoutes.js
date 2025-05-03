const express = require('express');
const router = express.Router();
const {
  verifyGithubSignature,
  githubWebhookHandler
} = require('../../controllers/ota/webhookController');

router.post(
  '/github-webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    try {
      verifyGithubSignature(req, res, req.body);
      req.body = JSON.parse(req.body.toString());
      next();
    } catch (err) {
      console.error("❌ Signature verification failed:", err.message);
      return res.status(401).json({ error: 'Unauthorized - Invalid Signature' });
    }
  },
  githubWebhookHandler
);

module.exports = router;