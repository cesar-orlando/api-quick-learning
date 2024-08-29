const mongoose = require("mongoose");

const DateCoursesSchema = new mongoose.Schema(
    {
        date: Date,
        courses: String,
        type: Number, /* 1 = Semana 1, 2 = Semana 2, 3 = Semana 3, 4 = Semana 4, 5 = no clases, 6 = vacaciones */
        status: Number
    },
    { timestamps: true }
);

module.exports = mongoose.models.DateCourses || mongoose.model("DateCourses", DateCoursesSchema);