const { STATUS } = require("../lib/constans");
const user = require("../models/user");

class userController {
  async create(data) {
    if (!data) return false;
    const userData = await user.create({
      email: data.email,
      password: data.password,
      name: data.name,
      //permissions: data.permissions,
      status: data?.status ? data?.status : STATUS.ACTIVE,
    });
    return userData ? userData : false;
  }
  async getAllCustom(filter, paginator) {
    let users;
    filter.status = { $in: [STATUS.ACTIVE, STATUS.INACTIVO] };
    let totalDoc = await user.countDocuments(filter);
    if (paginator) {
      const skipDocs = (paginator.pageNumber - 1) * paginator.pageSize || 0;
      users = await user.find(filter)
        .skip(skipDocs)
        .limit(paginator.pageSize)
        .sort({ createdAt: -1 });
    } else {
      users = await user.find(filter).sort({ createdAt: -1 });
    }
    if (users.length) return { users, totalDoc };
    return false;
  }
  async findOneCustom(filter) {
    if (!filter) return false;
    const userData = await user.findOne(filter);
    return userData ? userData : false;
  }

  async findById(id) {
    if (!id) return false;
    const userData = await user.findById(id);
    return userData ? userData : false;
  }

  async updateOneCustom(filter, data) {
    if (!filter || !data) return false;
    const userData = await user.findOneAndUpdate(
      filter,
      { $set: data },
      { new: true }
    );
    return userData ? userData : false;
  }
}

module.exports = new userController();
