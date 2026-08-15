const RunningJoke = require("../models/RunningJoke");

class RunningJokeStore {
  static async create(data) {
    return await RunningJoke.create(data);
  }

  static async get(userID) {
    return await RunningJoke.find({ userID })
      .sort({
        timesUsed: -1,
      })
      .lean();
  }
}

module.exports = RunningJokeStore;
