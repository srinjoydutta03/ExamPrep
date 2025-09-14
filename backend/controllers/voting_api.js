//API for upvoting/downvoting questions

import express from "express";
import { Question, Upvote } from "../database/schema.js";
import { userLoggedIn } from "../middleware/user_middleware.js";

//From root, the routes should be:
//POST /voting/:question_id/upvote
//POST /voting/:question_id/downvote
//DELETE /voting/:question_id
//GET /voting/:question_id

const router = express.Router();

//Logged in user upvotes a question
router.post("/:question_id/upvote", userLoggedIn, async (req, res) => {
  const question = await Question.findById(req.params.question_id).exec();
  if (!question) return res.sendStatus(404);
  let upvote = await Upvote.findOne({
    question: question._id,
    user: req.session.user._id,
  }).exec();
  if (upvote) {
    upvote.upvote = true;
    await upvote.save();
  }
  else upvote = await Upvote.create({
    question: question._id,
    user: req.session.user._id,
    upvote: true,
  });
  return res.sendStatus(200);
});

//Logged in user downvotes a question
router.post("/:question_id/downvote", userLoggedIn, async (req, res) => {
  const question = await Question.findById(req.params.question_id).exec();
  if (!question) return res.sendStatus(404);
  let upvote = await Upvote.findOne({
    question: question._id,
    user: req.session.user._id,
  }).exec();
  if (upvote) {
    upvote.upvote = false;
    await upvote.save();
  }
  else upvote = await Upvote.create({
    question: question._id,
    user: req.session.user._id,
    upvote: false,
  });
  return res.sendStatus(200);
});

//Logged in user UNvotes a function (neither upvote nor downvote)
router.delete("/:question_id", userLoggedIn, async (req, res) => {
  if (!req.params) return res.sendStatus(400);
  const upvote = await Upvote.findOne({
    question: req.params.question_id,
    user: req.session.user._id,
  }).exec();
  if(upvote) await upvote.deleteOne().exec();
  return res.sendStatus(204);
});

//Get upvote and downvote count of a question
//Returns {upvoteCount: Number, downvoteCount: Number}
router.get("/:question_id", async (req, res) => {
  if (!req.params) return res.sendStatus(400);
  const question = await Question.findById(req.params.question_id).select("_id").exec();
  if (!question) return res.sendStatus(404);
  const upvoteCount = await Upvote.countUpvotes(question._id);
  const downvoteCount = await Upvote.countDownvotes(question._id);
  return res.json({ upvoteCount, downvoteCount });
});

export default router;