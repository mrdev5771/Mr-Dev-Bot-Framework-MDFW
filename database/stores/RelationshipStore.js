const Relationship = require("../models/Relationship");

class RelationshipStore {
  // ============================================================
  // GET
  // ============================================================

  static async get(userID) {
    if (!userID) return null;

    const id = String(userID);

    let relationship = await Relationship.findOne({
      userID: id,
    }).lean();

    // Create default relationship if none exists
    if (!relationship) {
      relationship = await Relationship.create({
        userID: id,
        level: 1,
        title: "Stranger",
        messages: 0,
        trust: 0,
      });

      relationship = relationship.toObject();
    }

    return relationship;
  }

  // ============================================================
  // UPDATE
  // ============================================================

  static async update(userID, data = {}) {
    if (!userID) return null;

    const id = String(userID);

    const allowed = {};

    if (data.level !== undefined) {
      allowed.level = Number(data.level);
    }

    if (data.title !== undefined) {
      allowed.title = String(data.title);
    }

    if (data.messages !== undefined) {
      allowed.messages = Number(data.messages);
    }

    if (data.trust !== undefined) {
      allowed.trust = Number(data.trust);
    }

    return Relationship.findOneAndUpdate(
      { userID: id },
      { $set: allowed },
      {
        returnDocument: "after",
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).lean();
  }

  // ============================================================
  // INCREMENT MESSAGES
  // ============================================================

  static async incrementMessages(userID, amount = 1) {
    if (!userID) return null;

    return Relationship.findOneAndUpdate(
      { userID: String(userID) },
      {
        $inc: {
          messages: Number(amount) || 1,
        },
      },
      {
        returnDocument: "after",
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).lean();
  }

  // ============================================================
  // CLEAR
  // ============================================================

  static async clear(userID) {
    if (!userID) return null;

    return Relationship.deleteOne({
      userID: String(userID),
    });
  }
}

module.exports = RelationshipStore;
