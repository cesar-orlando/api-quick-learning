const { Router } = require("express");
const router = Router();
const Joi = require("joi");
const dateCoursesController = require("../../controller/dateCourses.controller");

router.post("/", async (req, res) => {
  try {
    const schema = Joi.object({
      date: Joi.date().required(),
      courses: Joi.string().required(),
      type: Joi.number().required(),
      status: Joi.number().required(),
    });
    const { date, courses, type, status } = await schema.validateAsync(req.body);
    const dateCourses = await dateCoursesController.create({
      date,
      courses,
      type,
      status,
    });
    return res.status(200).json({ message: "DateCourses created", dateCourses });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const dateCourses = await dateCoursesController.getAll();
    return res.status(200).json({ dateCourses });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

/* Actualizar los cursos que cuando pase de la fecha de hoy le ponga status 2 */
router.put("/", async (req, res) => {
  try {
    const dateCourses = await dateCoursesController.updateStatus();
    return res.status(200).json({ message: "DateCourses updated", dateCourses });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}
);

module.exports = router;
