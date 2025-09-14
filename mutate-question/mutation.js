import { ChatCohere } from "@langchain/cohere";
import { PromptTemplate } from "@langchain/core/prompts";
import { Question, Subject } from "../backend/database/schema.js"; // Adjust path as needed

// Configure Cohere LLM (ensure COHERE_API_KEY is in backend env)
const llm = new ChatCohere({
  model: "command-r-plus", // Or use user's preferred model "command"
  temperature: 0.7, // Or user's preferred temp
  maxRetries: 2,
  apiKey: process.env.COHERE_API_KEY, // Needs to be accessible
});

// Define the prompt template
const promptTemplate = `
Generate a new multiple-choice question (MCQ) by slightly altering the numerical values or wording of the original question below. Maintain the same topic and difficulty level.
The output MUST be a valid JSON object containing these keys: "question" (string), "description" (string, optional), "answers" (array of objects, each with "key": number and "text": string), "correctAnswerKey" (number), "correctAnswerExplanation" (string, optional), "subject" (string, original subject ID), "difficulty" (string, original difficulty level).

Original Question Details:
Subject ID: {subjectId}
Difficulty: {difficulty}
Question Text: {questionText}
Description: {descriptionText}
Answers: {answersText}
Correct Answer Key: {correctKey}
Correct Answer Explanation: {explanationText}

Generate the JSON object for the new, slightly mutated MCQ:
`;



/**
 * Generates a mutated question based on an original question ID.
 * @param {string} originalQuestionId - The ID of the question to mutate.
 * @param {string} userId - The ID of the user generating the question.
 * @param {boolean} isAdmin - Whether the generating user is an admin (for verification).
 * @returns {Promise<object>} The newly created question object.
 * @throws Will throw an error if fetching, generation, parsing, or saving fails.
 */
export default async function generateMutatedQuestion(originalQuestionId, userId, isAdmin) {
  // 1. Fetch original question
  const originalQuestion = await Question.findById(originalQuestionId).populate('subject').exec();
  if (!originalQuestion) {
    throw new Error(`Original question with ID ${originalQuestionId} not found.`);
  }

  // 2. Prepare data for prompt
  const input = {
    subjectId: originalQuestion.subject._id.toString(),
    difficulty: originalQuestion.difficulty,
    questionText: originalQuestion.question,
    descriptionText: originalQuestion.description || '',
    answersText: JSON.stringify(originalQuestion.answers.map(a => ({ key: a.key, text: a.text }))),
    correctKey: originalQuestion.correctAnswerKey.toString(),
    explanationText: originalQuestion.correctAnswerExplanation || '',
  };
  console.log("Calling LLM chain with input:", input);
  const aiMsg = await llm.invoke([
    [
      "system",
      `${promptTemplate}`,
    ],
    ["human", input],
  ]);
  // 3. Call LLM chain
  
  const resultString = aiMsg["content"]
  console.log("LLM Result String:", resultString);

  // 4. Parse JSON result (with basic cleanup)
  let parsedResult;
  try {
    const jsonMatch = resultString.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found in LLM response.");
    parsedResult = JSON.parse(jsonMatch[0]);
    console.log("Parsed LLM Result:", parsedResult);
  } catch (e) {
    console.error("Failed to parse LLM response:", resultString);
    throw new Error(`LLM response parsing failed: ${e.message}`);
  }

  // Basic validation of parsed result
  if (!parsedResult.question || !parsedResult.answers || !parsedResult.correctAnswerKey) {
    throw new Error("LLM response missing required fields (question, answers, correctKey).");
  }

  // 5. Create and save the new question
  const difficultyUpper = parsedResult.difficulty?.toUpperCase(); // Convert safely
 
  const newQuestionData = {
    question: parsedResult.question,
    description: parsedResult.description,
    descriptionMIME: 'text/plain', // Add missing field (assuming plain text/markdown)
    subject: originalQuestion.subject._id, // Explicitly use original subject ID
    answers: parsedResult.answers,
    correctAnswerKey: parsedResult.correctAnswerKey,
    correctAnswerExplanation: parsedResult.correctAnswerExplanation,
    difficulty: difficultyUpper, // Use the uppercased version
    uploader: userId,
    verified: isAdmin,
    generatedFrom: originalQuestionId,
  };

  // **Log the exact data before attempting to create**
  console.log("--- Preparing to create question with data: ---");
  console.log(JSON.stringify(newQuestionData, null, 2));
  console.log(`Subject type: ${typeof newQuestionData.subject}, Difficulty value: ${newQuestionData.difficulty}`);

  // Validate difficulty enum before creating
  const validDifficulties = ['EASY', 'MEDIUM', 'HARD']; // Assuming these are the valid enums
  if (!newQuestionData.difficulty || !validDifficulties.includes(newQuestionData.difficulty)) {
    const invalidDifficulty = parsedResult.difficulty || 'undefined';
    console.error(`LLM returned invalid or undefined difficulty: ${invalidDifficulty}. Valid are: ${validDifficulties.join(', ')}. Cannot create question.`);
    throw new Error(`LLM generated an invalid or undefined difficulty level: ${invalidDifficulty}`);
  }

  const createdQuestion = await Question.create(newQuestionData);
  console.log("Created new question:", createdQuestion._id);

  // 6. Return the new question object
  return createdQuestion.toObject();
}