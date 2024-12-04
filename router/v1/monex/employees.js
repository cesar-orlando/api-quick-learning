const { Router } = require("express");
const router = Router();
const Joi = require("joi");
const excel = require("exceljs");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const EmployeeController = require("../../../controller/monex/employee.controller");
const { MESSAGE_RESPONSE_CODE } = require("../../../lib/constans");
const sendEmailWithExcelLink = require("../../../services/monex/sendEmailWithExcelLink");

// Ruta para crear un nuevo empleado
router.post("/create", async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().required(),
      phone: Joi.string().required(),
      email: Joi.string().email().required(),
    });

    // Valida los datos del cuerpo de la solicitud
    await schema.validateAsync(req.body);

    // Verifica si el número de teléfono ya existe
    const existingEmployeeByPhone = await EmployeeController.findByPhone(req.body.phone);
    if (existingEmployeeByPhone) {
      return res.status(MESSAGE_RESPONSE_CODE.CONFLICT).json({ message: "El número de teléfono ya está registrado" });
    }

    // Verifica si el correo electrónico ya existe
    const existingEmployeeByEmail = await EmployeeController.findByEmail(req.body.email);
    if (existingEmployeeByEmail) {
      return res.status(MESSAGE_RESPONSE_CODE.CONFLICT).json({ message: "El correo electrónico ya está registrado" });
    }

    // Crea el empleado si el número y correo no existen
    const result = await EmployeeController.create(req.body);
    if (!result) {
      return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: "Datos de empleado inválidos" });
    }

    res.status(MESSAGE_RESPONSE_CODE.CREATED).json({ message: MESSAGE_RESPONSE_CODE.CREATED, employee: result });
  } catch (error) {
    res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: error.message });
  }
});

// Ruta para obtener todos los empleados
router.get("/all", async (req, res) => {
  const employees = await EmployeeController.getAll();
  res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: MESSAGE_RESPONSE_CODE.OK, employees: employees });
});



// Ruta para obtener todos los empleados con sus empresas asociadas
router.get("/employees-with-companies", async (req, res) => {
  try {
    const employees = await EmployeeController.getAllWithCompanies();
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/export-employees-companies", async (req, res) => {
  try {
    // Obtiene los IDs de empleados desde los parámetros de consulta
    const employeeIds = req.query.employeeIds ? req.query.employeeIds.split(",") : [];

    if (employeeIds.length === 0) {
      return res.status(400).json({ message: "Se requiere una lista de IDs de empleados válida en el parámetro 'employeeIds'." });
    }

    const workbook = new excel.Workbook();

    // Obtener empleados y sus empresas usando los IDs proporcionados
    const employees = await EmployeeController.getAllWithCompanies();

    // Filtrar solo los empleados solicitados
    const selectedEmployees = employees.filter((employee) => employeeIds.includes(employee._id.toString()));

    if (selectedEmployees.length === 0) {
      return res.status(404).json({ message: "No se encontraron empleados con los IDs proporcionados." });
    }

    // Crear una hoja de cálculo para cada empleado seleccionado
    selectedEmployees.forEach((employee) => {
      const worksheet = workbook.addWorksheet(employee.name); // Nombre de la hoja con el nombre del empleado

      // Define las columnas de la hoja de cálculo
      worksheet.columns = [
        { header: "NOMBRE DE LA EMPRESA", key: "company", width: 30 },
        { header: "PERSONA DE CONTACTO", key: "contact", width: 30 },
        { header: "NUMERO DE TELEFONO", key: "phone", width: 30 },
        { header: "CORREO ELECTRONICO", key: "email", width: 30 },
        { header: "DOMICILIO DE LA EMPRESA", key: "address", width: 30 },
        { header: "SEGUIMIENTO", key: "followup", width: 30 },
        { header: "Status", key: "status", width: 30 },
        { header: "Created At", key: "createdAt", width: 30 },
        { header: "Updated At", key: "updatedAt", width: 30 },
      ];

      // Aplica estilo a los encabezados
      worksheet.getRow(1).eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "96C8FB" },
          bgColor: { argb: "96C8FB" },
        };
        cell.font = {
          color: { argb: "#000000" },
          bold: true,
          size: 12,
          family: "Arial",
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Agrega cada empresa al worksheet del empleado
      employee.companies.forEach((company) => {
        worksheet.addRow({
          company: company.company,
          contact: company.contact || "",
          phone: company.phone || "",
          email: company.email || "",
          address: company.address || "",
          followup: company.followup || "",
          status: company.status || "",
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
        });
      });
    });

    // Configura los encabezados de la respuesta para enviar el archivo
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=employees_export.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Ruta POST para enviar el correo con el enlace de descarga
router.post("/send-excel-email", async (req, res) => {
  const { toEmail, downloadUrl } = req.body;

  if (!toEmail || !downloadUrl) {
    return res.status(400).json({ message: "Se requiere 'toEmail' y 'downloadUrl' en el cuerpo de la solicitud." });
  }

  // Llamada a la función para enviar el correo
  const result = await sendEmailWithExcelLink(toEmail, downloadUrl);

  if (result.success) {
    res.status(200).json({ message: "Correo enviado correctamente" });
  } else {
    res.status(500).json({ message: "Error al enviar el correo", error: result.message });
  }
});

//Ruta para editar un empleado
router.put("/edit/:id", async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().required(),
      phone: Joi.string().required(),
      email: Joi.string().email().required(),
    });

    // Valida los datos del cuerpo de la solicitud
    await schema.validateAsync(req.body);

    const employee = await EmployeeController.update(req.params.id, req.body);
    if (!employee) {
      return res.status(MESSAGE_RESPONSE_CODE.NOT_FOUND).json({ message: "Empleado no encontrado" });
    }
    res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: MESSAGE_RESPONSE_CODE.OK, employee: employee });
  } catch (error) {
    res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: error.message });
  }
});

// Ruta para traer un solo empleado con sus empresas asociadas
router.get("/:id", async (req, res) => {
  const employee = await EmployeeController.getByIdWithCompanies(req.params.id);
  if (!employee) {
    return res.status(404).json({ message: "Empleado no encontrado" });
  }
  res.status(200).json(employee);
});

// Ruta para obtener todas las empresas de un empleado específico
router.get("/:id/companies", async (req, res) => {
  const companies = await EmployeeController.getCompaniesByEmployee(req.params.id);
  res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: MESSAGE_RESPONSE_CODE.OK, companies: companies });
});

module.exports = router;
