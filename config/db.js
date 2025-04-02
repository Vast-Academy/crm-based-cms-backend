const mongoose = require("mongoose")

async function connnectDB () {
    try {
      await mongoose.connect(process.env.MONGODB_URI)
    } catch (err) {
        console.log(err);
        
    }
}

module.exports = connnectDB;