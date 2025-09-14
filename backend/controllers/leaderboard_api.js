import express from "express";
import { Question, Upvote, User } from "../database/schema.js";

const router = express.Router();

//From root, the routes should be:
//GET /leaderboard/verified - Users sorted on their number of verified questions
//GET /leaderboard/totalUpvotes - Users sorted on the total upvotes received on their number of verified questions
//Return array of user IDs in all cases

router.get("/verified", async (req, res) => {
  let users = await User.find().select("_id").exec();
  users = users.map((u) => u.toObject());

  for (let i = 0; i < users.length; i++) {
    users[i].verifiedQuestions = await Question.countDocuments({
      uploader: users[i]._id,
      verified: true,
    }).exec();
  }

  users = users.sort((a, b) => b.verifiedQuestions - a.verifiedQuestions);

  return res.json(users.map(u => u._id));
});

router.get("/totalUpvotes", async (_, res) => {
  let users = await User.find().select("_id").exec();
  users = users.map((u) => u.toObject());

  for (let i = 0; i < users.length; i++) {
    const userQuestions = await Question.find({
      uploader: users[i]._id,
      verified: true,
    })
      .select("_id")
      .exec();

    let totalUpvotes = 0;
    for (let j = 0; j < userQuestions.length; j++) {
      totalUpvotes += await Upvote.countNetVotes(userQuestions[j]._id);
    }

    users[i].totalUpvotes = totalUpvotes;
  }

  users = users.sort((a, b) => b.totalUpvotes - a.totalUpvotes);

  return res.json(users.map(u => u._id));
});

export default router;
