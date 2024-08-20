const { STATUS, STATUS_CUSTOMER } = require("../lib/constans");
const customer = require("../models/customer");


class customerController{
    async create(data) {
        
        if (!data) return false;
        console.log("data --->", data)
        const customerData = await customer.create({
          name: data.name,
          email: data.email,
          phone: data.phone,
          whatsAppProfile: data.whatsAppProfile,
          whatsAppNumber: data.whatsAppNumber,
          status: data?.status ? data?.status : STATUS_CUSTOMER.PENDIENTE,
        });
        console.log("customerData --->", customerData)
        return customerData ? customerData : false;
      }
      async updateOneCustom(filter, data) {
        if (!filter || !data) return false;
        const customerData = await customer.findOneAndUpdate
        (
          filter,
          { $set: data },
          { new: true }
        );
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