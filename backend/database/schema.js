import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, required: true, default: false },
});
export const User = mongoose.model("User", userSchema);

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  description: { type: String, required: true, trim: true },
});
//Create text index on subject name for subject search
subjectSchema.index({ name: "text", description: "text" });
export const Subject = mongoose.model("Subject", subjectSchema);

export const DIFFICULTY_LEVELS = ["EASY", "MEDIUM", "HARD"];
const answerSchema = new mongoose.Schema({
  //Custom key is required because answerSchema is a subdocument
  //Key can be any integer you choose but must be unique WITHIN
  //THE QUESTION (may repeat among questions). For the same reason
  //we cannot declare unique: true here.
  key: { type: mongoose.Schema.Types.Int32, required: true},
  text: { type: String, required: true, trim: true},
});
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  description: {type: String, required: false, default: ""},
  descriptionMIME: {type: String, required: false, default: "text/plain"},
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  answers: [answerSchema],
  //Refers to subdocuments in answers array.
  correctAnswerKey: { type: mongoose.Schema.Types.Int32, required: true },
  correctAnswerExplanation: { type: String, required: false, default: "" },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  difficulty: { type: String, required: true, enum: DIFFICULTY_LEVELS },
  verified: { type: Boolean, required: true, default: false },
  generatedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: false },
});
//Create text index on question and description fields for questionSchema
questionSchema.index({ question: "text", description: "text" });
export const Question = mongoose.model("Question", questionSchema);

const upvoteSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  //Upvote when true, DOWNvote when false, entire document should be deleted when none.
  upvote: { type: Boolean, required: true },
}, {
  statics: {
    async countUpvotes(question_id) {
      const upvoteCount = await this.countDocuments({
        question: question_id,
        upvote: true,
      }).exec();
      return upvoteCount;
    },
    async countDownvotes(question_id) {
      const downvoteCount = await this.countDocuments({
        question: question_id,
        upvote: false,
      }).exec();
      return downvoteCount;
    },
    async countNetVotes(question_id) {
      const upvoteCount = await this.countUpvotes(question_id);
      const downvoteCount = await this.countDownvotes(question_id);
      return upvoteCount - downvoteCount;
    }
  }
});
upvoteSchema.index({question: 1, user: 1}, {unique: true});
export const Upvote = mongoose.model("Upvote", upvoteSchema);

const quizSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  //Only verified questions here
  questions: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
  ],
  //Should be only for admin as of now.
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isPublic: { type: Boolean, required: true, default: false },
});
//We should be able to search quizzes by name
quizSchema.index({ name: "text" });
export const Quiz = mongoose.model("Quiz", quizSchema);

//Schema for a user attempting a quiz
const attemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  //Only public quizzes
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  answers: [
    {
      question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true,
      },
      answerKey: { type: mongoose.Schema.Types.Int32, required: true },
    },
  ]
}, {
  timestamps: true,
  methods: {
    async countCorrectAnswers() {
      let count = 0;
      for (let i = 0; i < this.answers.length; i++) {
        const question = await Question.findById(this.answers[i].question)
        .select("correctAnswerKey").exec();
        if (this.answers[i].answerKey == question.correctAnswerKey)
          count++;
      }
      return count;
    },
    async countIncorrectAnswers() {
      let count = 0;
      for (let i = 0; i < this.answers.length; i++) {
        const question = await Question.findById(this.answers[i].question)
        .select("correctAnswerKey").exec();
        if (this.answers[i].answerKey != question.correctAnswerKey)
          count++;
      }
      return count;
    },
    async countUnanswered() {
      const allQuestions = (await Quiz.findById(this.quiz)
        .select("questions")
        .exec()).questions;
      return allQuestions.length - this.answers.length;
    }
  }
});
export const Attempt = mongoose.model("Attempt", attemptSchema);
