const Joi = require("joi");
const { STATUS, VALIDATED_FIELDS } = require("../../lib/constans");
const Company = require("../../models/monex/company");
const Employee = require("../../models/monex/employee");

class CompanyController {
  // Método para crear una nueva empresa
  async create(data) {
    if (!data) return false;

    // Verifica si el nombre de la empresa ya existe
    const existingCompany = await Company.findOne({ company: data.company });
    if (existingCompany) {
      return { error: "El nombre de la empresa ya está registrado" };
    }

    // Verifica si el empleado existe antes de crear la empresa
    const employee = await Employee.findById(data.employeeId);
    if (!employee) {
      return { error: "Empleado no encontrado" };
    }

    const companyData = await Company.create({
      company: data.company,
      contact: data.contact,
      phone: data.phone,
      email: data.email,
      address: data.address,
      followup: data.followup,
      status: data.status || "ACTIVO", // Establece el estado predeterminado
      employee: employee._id, // Asigna el ObjectId del empleado
    });

    return companyData ? companyData : false;
  }

  // Método para obtener todas las empresas
  async getAll() {
    const companies = await Company.find().populate("employee"); // Incluye datos completos del empleado
    return companies;
  }

  // Método para actualizar una empresa existente
  async update(id, data) {
    if (!data) return { error: "Datos inválidos" };

    // Verifica si la empresa existe
    const existingCompany = await Company.findById(id);
    if (!existingCompany) {
      return { error: "Empresa no encontrada" };
    }

    // Verifica si el nuevo nombre de la empresa ya está en uso por otra empresa
    if (data.company && data.company !== existingCompany.company) {
      const duplicateCompany = await Company.findOne({ company: data.company });
      if (duplicateCompany) {
        return { error: "El nombre de la empresa ya está registrado" };
      }
    }

    // Si se proporciona un employeeId, verifica que el empleado existe
    if (data.employeeId) {
      const employee = await Employee.findById(data.employeeId);
      if (!employee) {
        return { error: "Empleado no encontrado" };
      }
      data.employee = employee._id; // Asigna el ObjectId del empleado
    }
    // Actualiza los datos de la empresa
    const updatedCompany = await Company.findByIdAndUpdate(id, data, { new: true });

    return updatedCompany ? updatedCompany : { error: "No se pudo actualizar la empresa" };
  }

  // Método para buscar empresas por estado
  async findByState(data) {
    if (!data) return false;

    const companyData = await Company.find({ "address.state": data.state }).populate("employee");
    return companyData ? companyData : false;
  }

  // Método para obtener empresas asociadas a un empleado específico
  async findByEmployee(employeeId) {
    const companies = await Company.find({ employee: employeeId });
    return companies;
  }

  // Método para agregar múltiples registros con validación y un employeeId asignado
  async addMultipleCompanies(companies, employeeId) {
    if (!companies || companies.length === 0) {
        return { error: "No se proporcionaron registros para agregar" };
    }

    // Verifica si el empleado existe antes de agregar los registros
    const employee = await Employee.findById(employeeId);
    if (!employee) {
        return { error: "Empleado no encontrado" };
    }

    // Conjunto de nombres de empresas existentes para evitar duplicados
    const existingCompanies = new Set();
    const formattedData = [];

    // Recupera las empresas existentes de la base de datos
    const existingRecords = await Company.find();
    existingRecords.forEach((record) => {
        existingCompanies.add(record.company);
    });

    // Transforma y procesa cada registro en `companies`
    for (const item of companies) {
        if (!existingCompanies.has(item.title)) {
            // Formatea el dato original al formato necesario para la base de datos
            const companyData = {
                company: item.title || item.name || "", // Asigna nombre vacío si no viene
                contact: `${item.nombreContacto || ""} ${item.apellidoPaterno || ""}  ${item.cargo || ""} ${item.area || ""}` || item.contact || "", // Asigna contacto vacío si no viene
                phone: item.phone || "", // Asigna teléfono vacío si no viene
                email: item.email || "", // Asigna email vacío si no viene
                address: item.address || `${item.street || ""}, ${item.city || ""}, ${item.state || ""}, ${item.countryCode || ""}`,
                followup: `${item.website || ""} ${item.categories ? item.categories.join(", ") : ""}` || item.followup || "", // Asigna seguimiento vacío si no viene
                status: "PENDIENTE", // Establece el estado predeterminado
                employee: employeeId
            };

            // Agrega el nombre de la empresa al conjunto y la empresa formateada a la lista
            existingCompanies.add(companyData.company);
            formattedData.push(companyData);
        }
    }

    try {
        // Inserta todas las empresas válidas en la base de datos
        const result = await Company.insertMany(formattedData);
        return result;
    } catch (error) {
        return { error: error.message };
    }
}
}

module.exports = new CompanyController();
