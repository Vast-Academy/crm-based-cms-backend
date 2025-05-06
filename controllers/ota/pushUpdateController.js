const path = require("path");
const fs = require("fs");
const simpleGit = require("simple-git");
const OtaCustomer = require("../../models/ota/Customer");

const getInstallationAccessToken = async (installationId) => {
  const { createAppAuth } = await import('@octokit/auth-app');
  const auth = createAppAuth({
    appId: process.env.GITHUB_APP_ID,
    privateKey: process.env.GITHUB_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  });

  const installationAuthentication = await auth({ type: "installation", installationId });
  return installationAuthentication.token;
};

const pushUpdateToRepo = async (req, res) => {
  const { customerId, updateType } = req.body;

  // Validate input parameters
  if (!customerId || !["frontend", "backend"].includes(updateType)) {
    return res.status(400).json({ error: "Missing or invalid parameters" });
  }

  // Fetch customer details
  const customer = await OtaCustomer.findById(customerId);
  if (!customer) {
    return res.status(404).json({ error: "Customer not found" });
  }

  const repoName = updateType === "frontend" ? customer.frontendRepo : customer.backendRepo;
  const installationId = customer.githubInstallationId;

  // Define paths
  const repoPath = path.join(__dirname, `../../updates/${updateType}`);
  const tmpFolder = path.join('/tmp', `ota-push-${updateType}-${customerId}-${Date.now()}`); // Use /tmp for writable directory

  try {
    // Create the temporary directory
    fs.mkdirSync(tmpFolder, { recursive: true });

    // Copy files to the temporary folder
    fs.cpSync(repoPath, tmpFolder, { recursive: true });

    const git = simpleGit(tmpFolder);
    const token = await getInstallationAccessToken(installationId);
    const remoteUrl = `https://x-access-token:${token}@github.com/${repoName}`;

    await git.init();
    await git.addConfig('user.name', 'Vast-Academy');
    await git.addConfig('user.email', 'syncvap@gmail.com');
    await git.addRemote("origin", remoteUrl);
    await git.add(".");

    
    const status = await git.status();
    if (status.files.length > 0) {
      await git.commit(`OTA Update - ${updateType} - ${new Date().toISOString()}`);
    } else {
      console.log("No changes to commit.");
      return res.status(200).json({ success: true, message: "No changes to push." });
    }
    // Check if 'main' branch exists
    const branches = await git.branch();
    if (!branches.all.includes('main')) {
      await git.checkoutLocalBranch('main'); // Create and switch to 'main' branch if it doesn't exist
    }
    await git.push("origin", "main", ["--force"]);
    // Update the customer record to mark the update as pushed
    await OtaCustomer.findByIdAndUpdate(customerId, {
      [`updateStatus.${updateType}.pushed`]: true,
    });
    return res.status(200).json({ success: true, message: `${updateType} update pushed.` });
  } catch (err) {
    console.error("Push failed:", err);
    return res.status(500).json({ error: "Update push failed", detail: err.message });
  }finally {
    // Clean up the temporary folder
    if (fs.existsSync(tmpFolder)) {
      fs.rmSync(tmpFolder, { recursive: true, force: true });
      console.log(`Cleaned up temporary folder: ${tmpFolder}`);
    }
  }
};

module.exports = { pushUpdateToRepo };