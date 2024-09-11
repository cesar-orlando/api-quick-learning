const { STATUS } = require("../lib/constans");
const promo = require("../models/promo");


class promoController {
    async create(data) {
        if (!data) return false;
        const promoData = await promo.create({
            name: data.name,
            description: data.description,
            status: data?.status ? data?.status : STATUS.ACTIVE,
        });
        return promoData ? promoData : false;
    }

    async findOneCustom(filter) {
        if (!filter) return false;
        const promoData = await promo.findOne(filter);
        return promoData ? promoData : false;
    }

    async getAll() {
        const data = await promo.find();
        return data ? data : false;
    }

    async findById(id) {
        if (!id) return false;
        const promoData = await promo.findById(id);
        return promoData ? promoData : false;
    }

    async updateOneCustom(filter, data) {
        if (!filter || !data) return false;
        const promoData = await promo.findOneAndUpdate(
            filter,
            { $set: data },
            { new: true }
        );
        return promoData ? promoData : false;
    }

}

module.exports = new promoController();