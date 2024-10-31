const { STATUS } = require("../../lib/constans");
const customers = require("../../models/monex/customers");

class customerMonexController{
    async create(data){
        if(!data) return false;
        const customerData = await customers.create({
            company: data.company,
            contact: data.contact,
            phone: data.phone,
            email: data.email,
            address: data.address,
            followup: data.followup,
            employee: data.employee,
            status: data?.status ? data?.status : STATUS.ACTIVE,
        });
        return customerData ? customerData : false;
    }

    async getAll(){
        const data = await customers.find();
        return data;
    }

    async findByCustomer(data){
        if(!data) return false;
        const customerData = await customers.find({ contact: data.contact });
        return customerData ? customerData : false;
    }

    async findById(id){
        if(!id) return false;
        const customerData = await customers.findById(id);
        return customerData ? customerData : false;
    }

    async update(id, data){
        if(!id || !data) return false;
        const customerData = await customers.findByIdAndUpdate(id, {
            company: data.company,
            contact: data.contact,
            phone: data.phone,
            email: data.email,
            address: data.address,
            followup: data.followup,
            employee: data.employee,
            status: data?.status ? data?.status : STATUS.ACTIVE,
        });
        return customerData ? customerData : false;
    }

    async createMany(data){
        if(!data) return false;
        const customersData = await customers.insertMany(data);
        return customersData ? customersData : false;
    }

    /* borrar todas las que tengan en employee sin asignar */
    async deleteMany(){
        const data = await customers.deleteMany({ employee: "Sin asignar" });
        return data;
    }
}

module.exports = new customerMonexController();