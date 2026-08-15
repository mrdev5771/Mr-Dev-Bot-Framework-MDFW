const Profile = require("../models/Profile");

class ProfileStore {
  // =========================
  // GET
  // =========================

  static async get(userID) {
    let profile = await Profile.findOne({ userID });

    if (!profile) {
      profile = await Profile.create({
        userID,
      });
    }

    return profile;
  }

  // =========================
  // SAVE
  // =========================

  static async save(profile) {
    return profile.save();
  }

  // =========================
  // DELETE
  // =========================

  static async delete(userID) {
    return Profile.deleteOne({
      userID,
    });
  }
}

module.exports = ProfileStore;
