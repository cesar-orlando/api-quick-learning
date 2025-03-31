const { STATUS } = require("../lib/constans");
const user = require("../models/user");

class userController {
  async create(data) {
    if (!data) return false;
    const userData = await user.create({
      email: data.email,
      password: data.password,
      name: data.name,
      permissions: data.permissions,
      country: data.country,
      phone: data.phone,
      status: data?.status ? data?.status : STATUS.ACTIVE,
      balance: data?.balance ? data?.balance : 0,
      company: data.company,
    });
    return userData ? userData : false;
  }

  async findOneCustom(filter) {
    if (!filter) return false;
    const userData = await user.findOne(filter);
    return userData ? userData : false;
  }

  async findAll() {
    const users = await user.find({ permissions: 3, status: STATUS.ACTIVE });
    return users;
  }

  async getAll(){
    const users = await user.find();
    return users;
  }

  async getAllCustom(filter, paginator) {
    let users;
    filter.status = { $in: [STATUS.ACTIVE, STATUS.INACTIVO] };
    let totalDoc = await user.countDocuments(filter);
    if (paginator) {
      const skipDocs = (paginator.pageNumber - 1) * paginator.pageSize || 0;
      users = await user.find(filter).skip(skipDocs).limit(paginator.pageSize).sort({ createdAt: -1 });
    } else {
      users = await user.find(filter).sort({ createdAt: -1 });
    }
    if (users.length) return { users, totalDoc };
    return false;
  }

  async findById(id) {
    if (!id) return false;
    const userData = await user.findById(id);
    return userData ? userData : false;
  }

  async updateOneCustom(filter, data) {
    if (!filter || !data) return false;
    const userData = await user.findOneAndUpdate(filter, { $set: data }, { new: true });
    return userData ? userData : false;
  }

  async topUpBalance(id, amount) {
    if (!id || !amount) return false;
    const userData = await user.findOneAndUpdate(
      { _id: id },
      { $inc: { balance: amount } },
      { new: true }
    );
    return userData ? userData : false;
  }

  async topUser(){
    const data = await user.find({permissions: 3}).sort({balance: -1}).limit(1);
    return data;
  }

  async updateStatus() {
    const specificUsers = [
      "Joanna Esmeralda Delabra Pelaez",
      "Reagan Alanis Jiménez Vilchis",
      "Joyce Montserrat Dorantes Martínez",
      "Yerali Jocelyne Leyva Rodríguez",
      "Beatriz Barragán Lozano",
      "Jimena Segura Dorantes",
      "Yair Valades Venegas",
      "Julio César Cortés Cebada",
      "Andrea Perez Cordoba"
    ];

    // Cambiar el status de los usuarios específicos a 1
    await user.updateMany({ name: { $in: specificUsers }, permissions: 3 }, { $set: { status: 1 } });

    // Cambiar el status de los demás usuarios a 2
    await user.updateMany({ name: { $nin: specificUsers }, permissions: 3 }, { $set: { status: 2 } });

    // Obtener los usuarios actualizados
    const updatedUsers = await user.find({ permissions: 3 });
    return updatedUsers;
  }
}

module.exports = new userController();
