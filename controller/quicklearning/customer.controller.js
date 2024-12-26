const { STATUS, STATUS_CUSTOMER, SOCIAL } = require("../../lib/constans");
const customer = require("../../models/quicklearning/customer");

class customerQLController {
  async create(data) {
    if (!data) return false;
    const customerData = await customer.create({
      name: data.name,
      phone: data.phone,
      comments: data.comments,
      classification: data?.classification ? data?.classification : "Prospecto", // Valor predeterminado del enum
      status: data?.status ? data?.status : STATUS_CUSTOMER.PENDIENTE,
      visitDetails: data?.visitDetails
        ? {
            branch: data.visitDetails.branch,
            date: data.visitDetails.date,
            time: data.visitDetails.time,
          }
        : {}, // Valores predeterminados vacíos
      enrollmentDetails: data?.enrollmentDetails
        ? {
            consecutive: data.enrollmentDetails.consecutive,
            course: data.enrollmentDetails.course,
            modality: data.enrollmentDetails.modality,
            state: data.enrollmentDetails.state,
            email: data.enrollmentDetails.email,
            source: data.enrollmentDetails.source,
            paymentType: data.enrollmentDetails.paymentType,
          }
        : {}, // Valores predeterminados vacíos
        ia: data.ia !== undefined ? data.ia : true, // Predeterminado: true
        agent: data?.agent ? data?.agent : "",
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
    return await customer.find().populate("user").sort({ creationDate: -1 });
  }

  async getByIDCustom(id) {
    return await customer.findById(id);
  }

  async updateAllCustom(filter, data) {
    if (!filter || !data) return false;
    const customerData = await customer
      .updateMany(filter, { $set: data }, { new: true })
      .sort({ creationDate: -1 });
    return customerData ? customerData : false;
  }

  async convertStatusToString() {
    try {
      // Usando Mongoose para actualizar todos los documentos
      const result = await customer.updateMany(
        {}, // Aplica el cambio a todos los documentos
        [
          {
            $set: {
              status: { $toString: "$status" }, // Convierte el campo 'status' a tipo String
            },
          },
        ]
      );

      // Devuelve los resultados de la operación
      return result;
    } catch (error) {
      console.error("Error updating status:", error);
      throw error;
    }
  }

  async createMany(data) {
    if (!data) return false;
    const customerData = await customer.insertMany(data);
    return customerData ? customerData : false;
  }
}

module.exports = new customerQLController();
