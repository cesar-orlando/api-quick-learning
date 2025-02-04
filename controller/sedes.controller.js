const { STATUS } = require("../lib/constans");
const sedes = require("../models/sedes");

class sedesController {
  async create(data) {
    if (!data) return false;
    const sedesData = await sedes.create({
      name: data.name,
      address: data.address,
      phone: data.phone,
      status: data?.status ? data?.status : STATUS.ACTIVE,
    });
    return sedesData ? sedesData : false;
  }

  async findOneCustom(filter) {
    if (!filter) return false;
    const sedesData = await sedes.findOne(filter);
    return sedesData ? sedesData : false;
  }

  async getAll(){
    const data = await sedes.find();
    const mapdata = data.map((item) => {
      return {
        name: item.name,
        address: item.address,
        phone: item.phone,
        status: item.status,
      };
    });
    return mapdata ? mapdata : false;
  }


  async findById(id) {
    if (!id) return false;
    const sedesData = await sedes.findById(id);
    return sedesData ? sedesData : false;
  }

  async updateOneCustom(filter, data) {
    if (!filter || !data) return false;
    const sedesData = await sedes.findOneAndUpdate(
      filter,
      { $set: data },
      { new: true }
    );
    return sedesData ? sedesData : false;
  }

  async createMany(data) {
    if (!data) return false;
    const sedesData = await sedes.insertMany(data);
    return sedesData ? sedesData : false;
  }
}

module.exports = new sedesController();