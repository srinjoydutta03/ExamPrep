//Get information about subjects

import express from "express";
import { Subject } from "../database/schema.js";
import { userIsAdmin } from "../middleware/user_middleware.js";
import { distance as levenshteinDistance } from "fastest-levenshtein";
const router = express.Router();

//Froom root, the routes should be:
//GET /subject/:id
//GET /subject/search?q=<search string>
//GET /subject
//POST /subject
//DELETE /subject/:id
//PUT /subject/:id

//Get ALL subject IDs
router.get("/", async (_, res) => {
  const subjects = await Subject.find().exec();
  return res.json(subjects);
});

//Text search of subject on subject name and description
//Requires query parameter q=<search string>
//Returns IDs
//This needs to be BEFORE the /:id route
router.get("/search", async (req, res) => {
  const query = req.query?.q;
  if(!query) 
    return res.status(400).json("Query required");

  let subjects = await Subject.find({
    $text: {$search: query}
  }, {
    score: {$meta: "textScore"}
  }).sort({score: {$meta: "textScore"}}).exec();

  subjects = subjects.sort((a, b) => {
    let comp = levenshteinDistance(a.name, query) - levenshteinDistance(b.name, query);
    if(comp != 0) return comp;
    comp = levenshteinDistance(a.description, query) - levenshteinDistance(b.description, query);
    return comp;
  }).map((subject) => subject._id);

  return res.json(subjects);
});

//Get information on a subject given id
router.get("/:id", async (req, res) => {
  if(!req.params) return res.sendStatus(400);
  const subject = await Subject.findById(req.params.id).exec();
  if (!subject) return res.sendStatus(404);
  return res.json(subject);
});

//If admin, post a new subject
router.post("/", userIsAdmin, async (req, res) => {
  if(!req.body) return res.sendStatus(400);
  const { name, description } = req.body;
  if (!name || !description)
    return res.status(400).json("Name and description required");
  if (await Subject.findOne({ name }).select("_id").exec())
    return res.status(409).json("Subject already exists");
  const newSubject = await Subject.create({ name, description });
  return res.status(201).json(newSubject);
});

//If admin, delete a subject given id
router.delete("/:id", userIsAdmin, async (req, res) => {
  if(!req.params) return res.sendStatus(400);
  const subject = await Subject.findById(req.params.id).exec();
  if (!subject) return res.sendStatus(404);
  await subject.deleteOne().exec();
  return res.sendStatus(200);
});

//If admin, PUT (update) a subject given id (only description)
router.put("/:id", userIsAdmin, async (req, res) => {
  if(!req.body || !req.params) return res.sendStatus(400);
  const subject = await Subject.findById(req.params.id);
  if (!subject) return res.sendStatus(404);
  const { description } = req.body;
  if (description) subject.description = description;
  await subject.save();
  return res.status(201).json(subject);
});

export default router;
