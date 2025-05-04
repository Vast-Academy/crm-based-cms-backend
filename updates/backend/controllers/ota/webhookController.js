const crypto = require('crypto');
const Customer = require('../../models/ota/Customer');

// Signature verify karne wala middleware
const verifyGithubSignature = (req, res, buf) => {
  const signature = req.headers['x-hub-signature-256'];
  const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(buf).digest('hex');

  if (signature !== digest) {
    throw new Error('Webhook signature verification failed');
  }
};

const githubWebhookHandler = async (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;

  try {
    if (event === 'installation' && payload.action === 'created') {
      const installationId = payload.installation.id;
      const accountLogin = payload.installation.account.login;
      const accountType = payload.installation.account.type;
      const htmlUrl = payload.installation.account.html_url;

      // Map repositories data (array mein convert karke useful fields nikaalna)
      const repositories = payload.repositories.map(repo => ({
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        html_url: repo.html_url || ''
      }));

      const frontendRepo = repositories.find(repo => repo.name === 'frontend');
      const backendRepo = repositories.find(repo => repo.name === 'backend');

      const customerExists = await Customer.findOne({ githubInstallationId: installationId });

      if (!customerExists) {
        await Customer.create({
          githubInstallationId: installationId,
          githubUsername: accountLogin,
          accountType,
          htmlUrl,
          frontendRepo: frontendRepo?.full_name || '',
          backendRepo: backendRepo?.full_name || '',
          repositories
        });
      }

      return res.status(200).json({ success: true });
    }

    res.status(200).json({ message: 'Event ignored' });
  } catch (error) {
    console.error('Webhook Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { verifyGithubSignature, githubWebhookHandler };