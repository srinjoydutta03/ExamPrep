//Main API routes file

import express from "express";
const router = express.Router();

import user_api from "./user_api.js";
router.use("/user", user_api);

import subject_api from "./subject_api.js";
router.use("/subject", subject_api);

import question_api from "./question_api.js";
router.use("/question", question_api);

import voting_api from "./voting_api.js";
router.use("/voting", voting_api);

import quiz_api from "./quiz_api.js";
router.use("/quiz", quiz_api);

import attempt_api from "./attempt_api.js";
router.use("/attempt", attempt_api);

import leaderboard_api from "./leaderboard_api.js";
router.use("/leaderboard", leaderboard_api);

export default router;