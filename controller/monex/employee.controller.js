const Company = require("../../models/monex/company");
const Employee = require("../../models/monex/employee");

class EmployeeController {
  // Método para buscar un empleado por su número de teléfono
  async findByPhone(phone) {
    return await Employee.findOne({ phone });
  }
  // Método para buscar un empleado por su correo electrónico
  async findByEmail(email) {
    return await Employee.findOne({ email });
  }
  // Método para crear un nuevo empleado
  async create(data) {
    if (!data) return false;

    const employeeData = await Employee.create({
      name: data.name.toUpperCase(),
      phone: data.phone,
      email: data.email,
      status: "Activo",
    });

    return employeeData ? employeeData : false;
  }

  // Método para obtener todos los empleados
  async getAll() {
    const employees = await Employee.find();
    return employees;
  }

  // Método para obtener todas las empresas asociadas a un empleado específico
  async getCompaniesByEmployee(employeeId) {
    const companies = await Company.find({ employee: employeeId }).populate("employee"); // Incluye datos completos del empleado
    return companies;
  }

    // Método para obtener todos los empleados junto con sus empresas asociadas
    async getAllWithCompanies() {
      return await Employee.find().populate({
        path: "companies",
        select: "company contact phone email address followup status createdAt updatedAt", // Campos de `Company` que queremos incluir
      });
    }
}

module.exports = new EmployeeController();
