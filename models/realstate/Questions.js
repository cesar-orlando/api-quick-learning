const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
    {
        question: String,
        answer: String,
        area: String,
    },
    { timestamps: true }
    );

module.exports = mongoose.models.Question || mongoose.model("Question", QuestionSchema);