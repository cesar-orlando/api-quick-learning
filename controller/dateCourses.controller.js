const { STATUS } = require("../lib/constans");
const dateCourses = require("../models/dateCourses");

class dateCoursesController{
    async create(data){
        if(!data) return false;
        const dateCoursesData = await dateCourses.create({
            date: data.date,
            course: data.course,
            type: data.type,
            status: data?.status ? data?.status : STATUS.ACTIVE,
        });
        return dateCoursesData ? dateCoursesData : false;
    }
    async getAll(){
        const data = await dateCourses.find().sort({date: 1});
        return data;
    }
}
module.exports = new dateCoursesController();