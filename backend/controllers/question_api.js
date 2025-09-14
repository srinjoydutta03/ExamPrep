//REST API for Questions

import express from "express";
import {
  Question,
  User,
  Upvote,
  Subject,
  DIFFICULTY_LEVELS,
} from "../database/schema.js";
import { userIsAdmin, userLoggedIn } from "../middleware/user_middleware.js";
import  generateMutatedQuestion  from "../../mutate-question/mutation.js";
import { distance as levenshteinDistance } from "fastest-levenshtein";
import mime_db from "mime-db";

const router = express.Router();

//Any question returned by this API is checked for verification when there is no user logged in,
//or when there is a user logged in but is not admin.

/*
When searching questions, 4 cases may arise, check in following order and do this:
user logged in, admin -> verification flag need not be checked.
no uploader specified, no user logged in -> return only verified questions
no uploader specified, user logged in -> return only verified questions UNION unverified questions from myself
uploader specified, user logged in and uploader == myself -> return ALL questions from myself
uploader specified, no user logged in -> return only verified questions from uploader
*/

//From root, the routes should be:
//GET /question/:id
//GET /question/search?q=<search string>&subject=<subject id>&difficulty=<difficulty level>&uploader=<uploader id>
//GET /question?subject=<subject id>&difficulty=<difficulty level>&uploader=<uploader id>
//POST /question
//DELETE /question/:id
//PUT /question/:id
//PUT /question/:id/verify

//Get all questions
//Possibly filtered on "subject", "difficulty" and "uploader" query parameters:
//{subject?: ObjectId, difficulty?: String, uploader?: ObjectId}
//Returns IDs.
//Returns unverified questions as well if user is admin
router.get("/", async (req, res) => {
  let queryObject = {};
  if (req.query) {
    if (req.query.subject) queryObject.subject = req.query.subject;
    if (req.query.difficulty) queryObject.difficulty = req.query.difficulty;
    const isLoggedIn = !!req.session.user;
    const isAdmin = isLoggedIn && req.session.user.isAdmin;
    if (isAdmin) {
      if (req.query.uploader) queryObject.uploader = req.query.uploader;
    } else if (isLoggedIn) {
      if (req.query.uploader) {
        queryObject.uploader = req.query.uploader;
        if (req.query.uploader != req.session.user._id)
          queryObject.verified = true;
      } else {
        queryObject["$or"] = [
          { verified: true },
          { uploader: req.session.user._id },
        ];
      }
    } else {
      queryObject.verified = true;
      if (req.query.uploader) queryObject.uploader = req.query.uploader;
    }
  } else {
    if(!(req.session.user && req.session.user.isAdmin)) queryObject.verified = true;
  }
  console.log("Query", queryObject);

  let questions = await Question.find(queryObject).select("_id").exec();
  for(let i = 0; i < questions.length; i++) {
    questions[i] = questions[i].toObject();
    questions[i].netVotes = await Upvote.countNetVotes(questions[i]._id);
  }
  questions = questions.sort((a, b) => b.netVotes - a.netVotes);

  return res.json(questions.map((q) => q._id));
});

//Search questions by text on question and description fields, possibly filtered
//by subject, difficulty and uploader like above.
//Query parameters
//{q?: String, subject?: ObjectId, difficulty?: String, uploader?: ObjectId}
//Returns IDs.
router.get("/search", async (req, res) => {
  let queryObject = {};
  if (req.query) {
    if (req.query.q) queryObject["$text"] = { $search: req.query.q };
    else return res.status(400).json("Query required");
    if (req.query.subject) queryObject.subject = req.query.subject;
    if (req.query.difficulty) queryObject.difficulty = req.query.difficulty;
    const isLoggedIn = !!req.session.user;
    const isAdmin = isLoggedIn && req.session.user.isAdmin;
    if (isAdmin) {
      if (req.query.uploader) queryObject.uploader = req.query.uploader;
    } else if (isLoggedIn) {
      if (req.query.uploader) {
        queryObject.uploader = req.query.uploader;
        if (req.query.uploader != req.session.user._id)
          queryObject.verified = true;
      } else {
        queryObject["$or"] = [
          { verified: true },
          { uploader: req.session.user._id },
        ];
      }
    } else {
      queryObject.verified = true;
      if (req.query.uploader) queryObject.uploader = req.query.uploader;
    }
  } else {
    return res.status(400).json("Query required");
  }
  console.log("Query", queryObject);

  let questions = await Question.find(queryObject, {
    score: { $meta: "textScore" },
  })
    .sort({ score: { $meta: "textScore" } })
    .select(["_id", "question", "description"])
    .exec();

  for(let i = 0; i < questions.length; i++) {
    questions[i] = questions[i].toObject();
    questions[i].netVotes = await Upvote.countNetVotes(questions[i]._id);
  }

  questions = questions
    .sort((a, b) => {
      let comp =
        levenshteinDistance(a.question, req.query.q) -
        levenshteinDistance(b.question, req.query.q);
      if (comp == 0)
        comp =
          levenshteinDistance(a.description, req.query.q) -
          levenshteinDistance(b.description, req.query.q);
      if (comp == 0) comp = b.netVotes - a.netVotes;
      return comp;
    })
    .map((q) => q._id);

  return res.json(questions);
});

//For frontend, get possible difficulty levels
router.get("/DIFFICULTY_LEVELS", (_, res) => {
  return res.json(DIFFICULTY_LEVELS);
});

//Get question by ID
router.get("/:id", async (req, res) => {
  if (!req.params) return res.sendStatus(400);
  let queryObject = { _id: req.params.id };
  if (req.session.user && !req.session.user.isAdmin)
    queryObject["$or"] = [
      { verified: true },
      { uploader: req.session.user._id },
    ];
  
  console.log("Query", queryObject);
  let question = await Question.findOne(queryObject)
    .populate("subject")
    //.populate("uploader")
    .exec();
  if (!question) return res.sendStatus(404);
  question = question.toObject();
  question.upvoteCount = await Upvote.countUpvotes(question._id);
  question.downvoteCount = await Upvote.countDownvotes(question._id);
  if(req.session.user) {
    const upvote = await Upvote.findOne({
      question: question._id,
      user: req.session.user._id,
    }).exec();
    if (upvote) {
      question.upvoted = upvote.upvote;
      question.downvoted = !upvote.upvote;
    } else {
      question.upvoted = question.downvoted = false;
    }
  } else {
    question.upvoted = question.downvoted = false;
  }

  return res.json(question);
});

//When user logged in, user posts a new question
//NOTE: Testing required.
router.post("/", userLoggedIn, async (req, res) => {
  if (!req.body) return res.sendStatus(400);
  let {
    question,
    description,
    descriptionMIME,
    subject,
    answers,
    correctAnswerKey,
    correctAnswerExplanation,
    difficulty,
  } = req.body;
  if (!question || !subject || !answers || !correctAnswerKey || !difficulty)
    return res
      .status(400)
      .json("Question, subject, answers, correctAnswerKey and difficulty required");
  if(!descriptionMIME) descriptionMIME = "text/plain";
  else if(!(descriptionMIME in mime_db))
    return res.status(400).json("Invalid descriptionMIME, must be a valid MIME type");
  //NOTE: LaTeX MIME type is application/x-latex or application/x-tex
  if (!DIFFICULTY_LEVELS.includes(difficulty))
    return res
      .status(400)
      .json("Difficulty must be one of " + DIFFICULTY_LEVELS);
  if (await Question.findOne({ question }).select("_id").exec())
    return res.status(409).json("Question already exists");
  //Check if subject exists
  const subjectExists = await Subject.findById(subject).select("_id").exec();
  if (!subjectExists) return res.status(404).json("Subject does not exist");
  //Check if answers is an array
  if (!Array.isArray(answers))
    return res.status(400).json("Answers must be an array");
  //Check if answers array is valid (must contain \'text\' and \'key\' properties)
  if (!answers.every((a) => "text" in a && "key" in a))
    return res
      .status(400)
      .json("Answers must contain 'text' and 'key' properties");
  //All keys in answers array must be unique
  const answerKeySet = new Set(answers.map((a) => a.key));
  if (answerKeySet.size != answers.length)
    return res.status(400).json("Answers keys must be unique");
  //Check if correctAnswerKey is in answers array
  if (!answerKeySet.has(correctAnswerKey))
    return res.status(400).json("Correct answer key must be in answers array");

  const newQuestion = await Question.create({
    question,
    description,
    descriptionMIME,
    subject: subjectExists._id,
    answers,
    correctAnswerKey,
    correctAnswerExplanation,
    uploader: req.session.user._id,
    difficulty,
    verified: false,
  });
  return res.status(201).json(newQuestion);
});

//When user logged in, user updates a question they uploaded themselves
//Can only change description, subject, answers, correctAnswerKey, correctAnswerExplanation, difficulty
router.put("/:id", userLoggedIn, async (req, res) => {
  if (!req.params) return res.sendStatus(400);
  let {
    description,
    descriptionMIME,
    subject,
    answers,
    correctAnswerKey,
    correctAnswerExplanation,
    difficulty,
  } = req.body;
  const question = await Question.findOne({
    _id: req.params.id,
    uploader: req.session.user._id,
  }).exec();
  if (!question) return res.sendStatus(404);
  if (description) question.description = description;
  
  if(descriptionMIME) {
    if(!(descriptionMIME in mime_db))
      return res.status(400).json("Invalid descriptionMIME, must be a valid MIME type");
    //NOTE: LaTeX MIME type is application/x-latex or application/x-tex
    question.descriptionMIME = descriptionMIME;
  }
  
  if (subject) {
    const subjectExists = await Subject.findById(subject).select("_id").exec();
    if (!subjectExists) return res.status(404).json("Subject does not exist");
    question.subject = subjectExists._id;
  }
  if (answers) question.answers = answers;
  if (correctAnswerKey) question.correctAnswerKey = correctAnswerKey;

  answers = question.answers;
  correctAnswerKey = question.correctAnswerKey;
  //Check if answers is an array
  if (!Array.isArray(answers))
    return res.status(400).json("Answers must be an array");
  //Check if answers array is valid (must contain \'text\' and \'key\' properties)
  if (!answers.every((a) => "text" in a && "key" in a))
    return res
      .status(400)
      .json("Answers must contain 'text' and 'key' properties");
  //All keys in answers array must be unique
  const answerKeySet = new Set(answers.map((a) => a.key));
  if (answerKeySet.size != answers.length)
    return res.status(400).json("Answers keys must be unique");
  //Check if correctAnswerKey is in answers array
  if (!answerKeySet.has(correctAnswerKey))
    return res.status(400).json("Correct answer key must be in answers array");

  if (correctAnswerExplanation)
    question.correctAnswerExplanation = correctAnswerExplanation;
  if (difficulty) {
    if (!DIFFICULTY_LEVELS.includes(difficulty))
      return res
        .status(400)
        .json("Difficulty must be one of " + DIFFICULTY_LEVELS);
    question.difficulty = difficulty;
  }
  await question.save();
  return res.status(200).json(question);
});

//When user logged in, user can delete a question they uploaded themselves
router.delete("/:id", userLoggedIn, async (req, res) => {
  if (!req.params) return res.sendStatus(400);
  const question = await Question.findOne({
    _id: req.params.id,
    uploader: req.session.user._id,
  }).exec();
  if (!question) return res.sendStatus(404);
  await question.deleteOne().exec();
  return res.sendStatus(204);
});

//If admin, can verify a question
//Body {verified?: Boolean}?
router.put("/:id/verify", userIsAdmin, async (req, res) => {
  if (!req.params || !req.body) return res.sendStatus(400);
  let verified = !!req.body.verified;
  const question = await Question.findById(req.params.id).exec();
  if (!question) return res.sendStatus(404);
  question.verified = verified;
  await question.save();
  return res.json(question);
});

// AI generate a mutated question based on an existing one
router.post("/mutate", userLoggedIn, async (req, res) => {
  if (!req.body || !req.body.originalQuestionId) {
    return res.status(400).json({ error: "Missing originalQuestionId in request body" });
  }

  const { originalQuestionId } = req.body;
  const userId = req.session.user._id;
  const isAdmin = req.session.user.isAdmin;

  try {
    const newQuestion = await generateMutatedQuestion(originalQuestionId, userId, isAdmin);
    // Return the ID or the full new question object
    return res.status(201).json({ newQuestionId: newQuestion._id, question: newQuestion });
  } catch (error) {
    console.error(`Error generating mutated question from ${originalQuestionId}:`, error);
    // Send back a more specific error message if possible
    const errorMessage = error.message || 'AI question mutation failed';
    return res.status(500).json({ error: errorMessage });
  }
});

export default router;
