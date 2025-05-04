const path = require("path");
const fs = require("fs");
const { createAppAuth } = require("@octokit/auth-app");
const simpleGit = require("simple-git");
const OtaCustomer = require("../../models/ota/Customer");

const privateKey = fs.readFileSync(path.join(__dirname, "../../config/private-key.pem"), "utf8");

const getInstallationAccessToken = async (installationId) => {
  const auth = createAppAuth({
    appId: process.env.GITHUB_APP_ID,
    privateKey,
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  });

  const installationAuthentication = await auth({ type: "installation", installationId });
  return installationAuthentication.token;
};

const pushUpdateToRepo = async (req, res) => {
  const { customerId, updateType } = req.body;

  if (!customerId || !["frontend", "backend"].includes(updateType)) {
    return res.status(400).json({ error: "Missing or invalid parameters" });
  }

  const customer = await OtaCustomer.findById(customerId);
  if (!customer) {
    return res.status(404).json({ error: "Customer not found" });
  }

  const repoName = updateType === "frontend" ? customer.frontendRepo : customer.backendRepo;
  const installationId = customer.githubInstallationId;

  const repoPath = path.join(__dirname, `../../updates/${updateType}`);
  const tmpFolder = path.join(__dirname, `../../temp-push-${Date.now()}`);
  fs.mkdirSync(tmpFolder);

  // Copy files to a temporary folder
  fs.cpSync(repoPath, tmpFolder, { recursive: true });

  const git = simpleGit(tmpFolder);
  const token = await getInstallationAccessToken(installationId);
  const remoteUrl = `https://x-access-token:${token}@github.com/${repoName}.git`;

  try {
    await git.init();
    await git.addRemote("origin", remoteUrl);
    await git.add(".");
    await git.commit(`OTA Update - ${updateType} - ${new Date().toISOString()}`);
    await git.push("origin", "main", ["--force"]);

    fs.rmSync(tmpFolder, { recursive: true, force: true });

    return res.status(200).json({ success: true, message: `${updateType} update pushed.` });
  } catch (err) {
    console.error("Push failed:", err);
    return res.status(500).json({ error: "Update push failed", detail: err.message });
  }
};

module.exports = { pushUpdateToRepo };