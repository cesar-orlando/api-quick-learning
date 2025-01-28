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
        const data = await dateCourses.find({ status: 1 }).sort({date: 1});
        return data;
    }

    async updateStatus(){
        const date = new Date();
        const data = await dateCourses.updateMany({ date: { $lt: date }, status: 1 }, { status: 2 });
        return data;
    }
    async createMany(data){
        if(!data) return false;
        const dateCoursesData = await dateCourses.insertMany(data);
        return dateCoursesData ? dateCoursesData : false;
    }
}
module.exports = new dateCoursesController();