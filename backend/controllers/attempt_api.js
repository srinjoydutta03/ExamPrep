//API for attempting quizzes

import express from "express";
import { Attempt, Question, Quiz } from "../database/schema.js";
import { userLoggedIn } from "../middleware/user_middleware.js";

const router = express.Router();

//Get all of my attempts, optionally for a specific quiz, sorted by created latest first
//Requires URL query parameter quiz_id=<quiz id>
router.get("/", userLoggedIn, async (req, res) => {
  const attempts = await Attempt.find({
    user: req.session.user._id,
    ...(req.query?.quiz_id && { quiz: req.query.quiz_id }),
  })
    .sort({ createdAt: -1, updatedAt: -1 })
    .select("_id")
    .exec();
  return res.json(attempts.map((a) => a._id));
});

//Get attempt by ID
router.get("/:id", userLoggedIn, async (req, res) => {
  if (!req.params) return res.sendStatus(400);
  let attempt = await Attempt.findOne({
    _id: req.params.id,
    user: req.session.user._id,
  }).exec();
  if (!attempt) return res.sendStatus(404);
  attempt = attempt.toObject();

  //Number of questions unanswered
  const quiz = await Quiz.findById(attempt.quiz)
    .select(["_id", "questions"])
    .exec();
  console.log(quiz);
  //assert(quiz);
  attempt.numUnanswered = quiz.questions.length - attempt.answers.length;

  //Check which of the answers were correct
  let numCorrect = 0,
    numIncorrect = 0;
  for (let i = 0; i < attempt.answers.length; i++) {
    const question = await Question.findById(attempt.answers[i].question)
      .select("correctAnswerKey")
      .exec();
    attempt.answers[i].correct =
      attempt.answers[i].answerKey == question.correctAnswerKey;
    if (attempt.answers[i].correct) numCorrect++;
    else numIncorrect++;
  }
  attempt.numCorrect = numCorrect;
  attempt.numIncorrect = numIncorrect;

  return res.json(attempt);
});

//When user logged in, user posts a new attempt
//Body {quiz: <quiz id>, answers: [{question: <question id>, answerKey: <answer key integer>}]}
//answers array may be == []
router.post("/", userLoggedIn, async (req, res) => {
  if (!req.body) return res.sendStatus(400);
  const { quiz, answers } = req.body;
  if (!quiz || !answers)
    return res.status(400).json("Quiz and answers required");

  //Check if quiz exists
  const quizExists = await Quiz.findOne({ _id: quiz, isPublic: true })
    .select(["_id", "questions"])
    .exec();
  if (!quizExists) return res.status(404).json("Quiz does not exist");

  //Check if answers is an array
  if (!Array.isArray(answers))
    return res.status(400).json("Answers must be an array");
  //Check if answers array is valid (must contain \'question\' and \'answerKey\' properties)
  if (!answers.every((a) => "question" in a && "answerKey" in a))
    return res
      .status(400)
      .json("Answers must contain question and answerKey properties");
  //All question keys in answers must be unique
  if (new Set(answers.map((a) => a.question)).size !== answers.length)
    return res.status(400).json("All questions must be unique");
  //Check if all questions are a part of the quiz
  if (!answers.every((a) => quizExists.questions.includes(a.question)))
    return res.status(400).json("All questions must be a part of the quiz");
  //All answerKey values in answer must be a valid answerKey for each question
  for (let i = 0; i < answers.length; i++) {
    const question = await Question.findById(answers[i].question)
      .select(["_id", "answers"])
      .exec();
    const questionAnswerKeys = question.answers.map((a) => a.key);
    if (!questionAnswerKeys.includes(answers[i].answerKey))
      return res
        .status(400)
        .json(
          "Answer key " +
            answers[i].answerKey +
            " is not a valid answer key for question " +
            answers[i].question
        );
  }

  //Now save this attempt
  const attempt = new Attempt({
    user: req.session.user._id,
    quiz,
    answers,
  });
  await attempt.save();
  return res.status(200).json(attempt);
});

//Post a new answer to a question to an attempt ID
//Requires body {answerKey: <answer key>}
router.post("/:id/answers/:question_id", userLoggedIn, async (req, res) => {
  if (!req.params || !req.body) return res.sendStatus(400);
  const attempt = await Attempt.findOne({
    _id: req.params.id,
    user: req.session.user._id,
  })
    .populate("quiz")
    .exec();
  if (!attempt) return res.sendStatus(404);
  if (!attempt.quiz.questions.includes(req.params.question_id))
    return res.status(404).json("Question not part of quiz");
  if (!req.body.answerKey) return res.status(400).json("answerKey required");

  //Check if a valid answer key for the question
  const question = await Question.findById(req.params.question_id)
    .select(["_id", "answers"])
    .exec();
  const questionAnswerKeys = question.answers.map((a) => a.key);
  if (!questionAnswerKeys.includes(req.body.answerKey))
    return res
      .status(400)
      .json(
        "Answer key " +
          req.body.answerKey +
          " is not a valid answer key for question " +
          req.params.question_id
      );

  const index = attempt.answers.findIndex(
    (a) => a.question == req.params.question_id
  );
  if (index < 0) {
    attempt.answers.push({
      question: req.params.question_id,
      answerKey: req.body.answerKey,
    });
    await attempt.save();
    return res.sendStatus(201);
  } else {
    attempt.answers[index].answerKey = req.body.answerKey;
    await attempt.save();
    return res.sendStatus(204);
  }
});

//Delete an answer to a question in a quiz attempt
router.delete("/:id/answers/:question_id", userLoggedIn, async (req, res) => {
  if (!req.params) return res.sendStatus(400);
  const attempt = await Attempt.findOne({
    _id: req.params.id,
    user: req.session.user._id,
  }).exec();
  if (!attempt) return res.sendStatus(404);
  const index = attempt.answers.findIndex(
    (a) => a.question == req.params.question_id
  );
  if (index < 0) return res.sendStatus(204);
  attempt.answers.splice(index, 1);
  await attempt.save();
  return res.sendStatus(200);
});

//Delete attempt by ID
router.delete("/:id", userLoggedIn, async (req, res) => {
  if (!req.params) return res.sendStatus(400);
  const attempt = await Attempt.findOne({
    _id: req.params.id,
    user: req.session.user._id,
  }).exec();
  if (!attempt) return res.sendStatus(404);
  await attempt.deleteOne().exec();
  return res.sendStatus(200);
});

export default router;
