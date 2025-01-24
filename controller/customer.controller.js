const { STATUS, STATUS_CUSTOMER, SOCIAL } = require("../lib/constans");
const customer = require("../models/quicklearning/customer");

console.log("Customer model:", customer); // Agrega esta línea
class customerController {
  async create(data) {
    if (!data) return false;

    const customerData = await customer.create({
      name: data.name,
      phone: data.phone,
      comments: data.comments,
      classification: data.classification,
      status: data.status,
      visitDetails: { branch: data.visitDetails.branch, date: data.visitDetails.date, time: data.visitDetails.time },
      enrollmentDetails: {
        consecutive: data.enrollmentDetails.consecutive,
        course: data.enrollmentDetails.course,
        modality: data.enrollmentDetails.modality,
        state: data.enrollmentDetails.state,
        email: data.enrollmentDetails.email,
        source: data.enrollmentDetails.source,
        paymentType: data.enrollmentDetails.paymentType,
      },
      user: data.user,
      ia: data.ia,
    });
    return customerData ? customerData : false;
  }
  async updateOneCustom(filter, data) {
    if (!filter || !data) return false;
    const customerData = await customer.findOneAndUpdate(filter, { $set: data }, { new: true });
    return customerData ? customerData : false;
  }
  async findOneCustom(filter) {
    if (!filter) return false;
    const customerData = await customer.findOne(filter);
    return customerData ? customerData : false;
  }
  async getAllCustom() {
    return await customer.find().sort({ date: -1 });
  }
}

module.exports = new customerController();
