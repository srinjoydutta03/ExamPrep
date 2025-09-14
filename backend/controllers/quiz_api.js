//API for quizzes

import express from "express";
import { Question, Quiz, User } from "../database/schema.js";
import { userIsAdmin } from "../middleware/user_middleware.js";

const router = express.Router();

//Admin can create a quiz
//Body {name: String, questions: [Question ID], isPublic?: Boolean}
//questions array can be == [] but must be present
router.post("/", userIsAdmin, async (req, res) => {
  if (!req.body) return res.sendStatus(400);
  const { name, questions, isPublic } = req.body;
  if (!name || !questions)
    return res.status(400).json("Name and questions required");

  //Check if name is duplicated
  if (await Quiz.findOne({ name }).select("_id").exec())
    return res.status(409).json("Name already exists");

  //Check if questions are valid
  if (!Array.isArray(questions))
    return res.status(400).json("Questions must be an array");

  //All questions must be unique
  if (new Set(questions).size !== questions.length)
    return res.status(400).json("Questions must be unique");

  //Each and every element of questions array must map to a valid id of Question
  //and must be verified
  for (let i = 0; i < questions.length; i++) {
    const question = await Question.findById(questions[i])
      .select(["_id", "verified"])
      .exec();
    if (!question) {
      return res
        .status(400)
        .json("Question " + questions[i] + " does not exist");
    }
    if (!question.verified) {
      return res
        .status(400)
        .json("Question " + questions[i] + " is not verified");
    }
  }

  const newQuiz = await Quiz.create({
    name,
    questions,
    creator: req.session.user._id,
    isPublic: !!isPublic,
  });
  return res.status(201).json(newQuiz);
});

//Admin can update a quiz
router.put("/:id", userIsAdmin, async (req, res) => {
  if (!req.body) return res.sendStatus(400);
  const { questions, isPublic } = req.body;
  const quiz = await Quiz.findById(req.params.id).exec();
  if (!quiz) return res.sendStatus(404);
  if (questions) {
    //Check if questions are valid
    if (!Array.isArray(questions))
      return res.status(400).json("Questions must be an array");

    //All questions must be unique
    if (new Set(questions).size !== questions.length)
      return res.status(400).json("Questions must be unique");

    //Each and every element of questions array must map to a valid id of Question
    for (let i = 0; i < questions.length; i++) {
      const question = await Question.findById(questions[i])
        .select(["_id", "verified"])
        .exec();
      if (!question) {
        return res
          .status(400)
          .json("Question " + questions[i] + " does not exist");
      }
      if (!question.verified) {
        return res
          .status(400)
          .json("Question " + questions[i] + " is not verified");
      }
    }

    quiz.questions = questions;
  }
  if("isPublic" in req.body) quiz.isPublic = !!isPublic;
  await quiz.save();
  return res.json(quiz);
});

//Admin can delete a quiz
router.delete("/:id", userIsAdmin, async (req, res) => {
  if (!req.params) return res.sendStatus(400);
  const quiz = await Quiz.findById(req.params.id).exec();
  if (!quiz) return res.sendStatus(404);
  await quiz.deleteOne().exec();
  return res.sendStatus(200);
});

//Admin can add a question to a quiz
router.post("/:id/questions/:question_id", userIsAdmin, async (req, res) => {
  if (!req.params) return res.sendStatus(400);
  const quiz = await Quiz.findById(req.params.id).exec();
  if (!quiz) return res.status(404).json("Quiz does not exist");
  const question = await Question.findById(req.params.question_id)
    .select(["_id", "verified"])
    .exec();
  if (!question) return res.status(404).json("Question does not exist");
  if (!question.verified)
    return res.status(400).json("Question is not verified");
  const alreadyPresent = quiz.questions.includes(question._id);
  if (alreadyPresent) return res.sendStatus(204);
  quiz.questions.push(question._id);
  await quiz.save();
  return res.sendStatus(201);
});

//Admin can delete a question from a quiz
router.delete("/:id/questions/:question_id", userIsAdmin, async (req, res) => {
  if (!req.params) return res.sendStatus(400);
  const quiz = await Quiz.findById(req.params.id).exec();
  if (!quiz) return res.status(404).json("Quiz does not exist");
  const question = await Question.findById(req.params.question_id)
    .select(["_id"])
    .exec();
  if (!question) return res.status(404).json("Question does not exist");
  const index = quiz.questions.indexOf(question._id);
  if (index < 0) return res.sendStatus(204);
  quiz.questions.splice(index, 1);
  await quiz.save();
  return res.sendStatus(200);
});

//Get all quiz IDs sorted in alphabetical order of name
router.get("/", async (req, res) => {
  let queryObject = {};
  if (!(req.session.user && req.session.user.isAdmin))
    queryObject.isPublic = true;
  console.log("Query", queryObject);
  const quizzes = await Quiz.find(queryObject)
    .sort({ name: 1 })
    .select("_id")
    .exec();
  return res.json(quizzes.map((quiz) => quiz._id));
});

//Search for quiz by name, return IDs
router.get("/search", async (req, res) => {
  const query = req.query?.q;
  if (!query) return res.status(400).json("Query required");
  let queryObject = { $text: { $search: query } };
  if (!(req.session.user && req.session.user.isAdmin))
    queryObject.isPublic = true;
  console.log("Query", queryObject);
  const quizzes = await Quiz.find(queryObject, {
    score: { $meta: "textScore" },
  })
    .sort({ score: { $meta: "textScore" } })
    .select("_id")
    .exec();
  return res.json(quizzes.map((quiz) => quiz._id));
});

//Get quiz given ID
router.get("/:id", async (req, res) => {
  if (!req.params) return res.sendStatus(400);
  let queryObject = {_id: req.params.id};
  if (!(req.session.user && req.session.user.isAdmin))
    queryObject.isPublic = true;
  const quiz = await Quiz.findOne(queryObject).exec();
  if (!quiz) return res.sendStatus(404);
  return res.json(quiz);
});

export default router;
