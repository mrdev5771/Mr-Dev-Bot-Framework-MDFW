const mongoose = require("mongoose");

class MongoManager {
  static connected = false;

  static async connect() {
    if (this.connected) return;

    try {
      await mongoose.connect(process.env.MONGO_URI);

      this.connected = true;

      console.log("🍃 MongoDB Connected");
    } catch (err) {
      console.error("❌ MongoDB Connection Error");

      console.error(err);

      process.exit(1);
    }
  }
}

module.exports = MongoManager;
