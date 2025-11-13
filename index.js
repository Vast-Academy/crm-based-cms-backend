const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const connectDB = require('./config/db')
const router = require('./routes')
const webhookRoutes = require('./routes/ota/webhookRoutes')
const pushRoutes = require('./routes/ota/pushRoutes');
const cron = require("node-cron");
const axios = require("axios");

const app = express()
const allowedOrigins = [
    'https://crm-based-cms-frontend.vercel.app', 
    'https://www.codeonwork.in',
    'https://codeonwork.in',
    process.env.FORNTEND_URL, // आपके .env से
    'http://localhost:3000', 
     'capacitor://localhost',
      'http://localhost',
      'https://localhost'
  ].filter(Boolean);
  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"]
  }));

  app.options('*', (req, res) => {
    res.status(200).end();
  });

app.use('/api/webhooks', webhookRoutes);


app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.use('/api/ota', pushRoutes);

app.use("/api", router);

app.head('/ping', (req, res) => {
  console.log('HEAD Ping received at:', new Date().toISOString());
  res.status(200).end(); // No body, only headers
});

const PORT = process.env.PORT || 8080;
const KEEP_ALIVE_URL = process.env.KEEP_ALIVE_URL;

// 2️⃣ Cron Job: Har 5 minutes me `/ping` API call karega
cron.schedule("*/5 * * * *", async () => {
  try {
    if (KEEP_ALIVE_URL) {
      await axios.head(KEEP_ALIVE_URL);
      console.log(` ✅ Keep-alive request sent to ${KEEP_ALIVE_URL}`);
    } else {
      console.warn("⚠️ KEEP_ALIVE_URL is not set in .env file");
    }
  } catch (error) {
    console.error("❌ Keep-alive request failed:", error.message);
  }
});

connectDB().then(()=>{
    app.listen(PORT,()=>{
        console.log("connnect to DB")
        console.log("Server is running "+PORT)
    })
})