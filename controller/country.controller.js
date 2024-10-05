const { STATUS } = require("../lib/constans");
const country = require("../models/country");

class countryController {
    async create(data) {
        if (!data) return false;
        const countryData = await country.create({
            company: data.company,
            number: data.number,
            email: data.email,
            state: data.state,
            city: data.city,
            street: data.street,
            zipcode: data.zipcode,
            status: data?.status ? data?.status : STATUS.ACTIVE,
        });
        return countryData ? countryData : false;
    }

    async getAll() {
        const countries = await country.find();
        return countries;
    }
    
    async findByCountry(data) {
        if (!data) return false;
        const countryData = await country.find({ state: data.state });
        return countryData ? countryData : false;
    }
}
module.exports = new countryController();
