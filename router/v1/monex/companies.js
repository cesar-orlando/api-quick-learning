const express = require("express");
const router = express.Router();
const Joi = require("joi");
const excel = require("exceljs");


const CompanyController = require("../../../controller/monex/company.controller");
const { STATUS, MESSAGE_RESPONSE_CODE, VALIDATED_FIELDS } = require("../../../lib/constans");
const { googleNuevoLeon } = require("../../../db/dataMonex");

// Ruta para crear una nueva empresa
router.post("/create", async (req, res) => {
  try {
    // Define el esquema de validación usando Joi
    const schema = Joi.object({
      company: VALIDATED_FIELDS.COMPANY.required(),
      contact: VALIDATED_FIELDS.NAME.required(),
      phone: VALIDATED_FIELDS.PHONE.required(),
      email: VALIDATED_FIELDS.EMAIL.required(),
      address: VALIDATED_FIELDS.ADDRESS.required(),
      followup: Joi.string().allow(""), // Opcional
      employeeId: Joi.string().required(), // Asegúrate de que el ID del empleado es obligatorio
    });

    // Validación de los datos de la solicitud
    await schema.validateAsync(req.body);

    // Llama al método create en CompanyController
    const result = await CompanyController.create(req.body);

    // Verifica si hubo un error en la creación
    if (result.error) {
      return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: result.error });
    }
    // Responde con éxito si la creación fue exitosa
    res.status(MESSAGE_RESPONSE_CODE.CREATED).json(result);
  } catch (error) {
    // Manejo de errores de validación o de ejecución
    res.status(400).json({ message: error.message });
  }
});

// Ruta para obtener todas las empresas
router.get("/all", async (req, res) => {
  const companies = await CompanyController.getAll();
  res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: MESSAGE_RESPONSE_CODE.OK, companies: companies });
});

// Ruta para agregar múltiples empresas
router.post("/bulk-add", async (req, res) => {
  try {
    const { dataCompanies,  employeeId } = req.body;

    // Verifica que los datos necesarios estén presentes
    if (!dataCompanies || !employeeId) {
      return res.status(400).json({ message: "Datos insuficientes: se requiere googleNuevoLeon y employeeId" });
    }

    // Llama al método para agregar múltiples registros
    const result = await CompanyController.addMultipleCompanies(dataCompanies, employeeId);

    // Verifica si hubo un error en la inserción
    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    // Responde con los resultados de la inserción
    res.status(201).json({ message: "Empresas agregadas exitosamente", total: result.length, companies: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ruta para exportar empresas a un archivo Excel
router.get("/export", async (req, res) => {
  try {
    const data = await CompanyController.getAll(); // Obtiene todos los registros con el campo `employee` poblado

    const workbook = new excel.Workbook();

    // Agrupa los datos por nombre del empleado
    const groupedData = data.reduce((acc, item) => {
      const employeeName = item.employee ? item.employee.name : "Sin Asignar"; // Usa el nombre del empleado o "Sin Asignar"
      (acc[employeeName] = acc[employeeName] || []).push(item);
      return acc;
    }, {});

    // Crea una hoja de cálculo para cada empleado
    for (const employeeName in groupedData) {
      const worksheet = workbook.addWorksheet(employeeName);

      // Define las columnas de la hoja de cálculo
      worksheet.columns = [
        { header: "NOMBRE DE LA EMPRESA", key: "company", width: 30 },
        { header: "PERSONA DE CONTACTO", key: "contact", width: 30 },
        { header: "NUMERO DE TELEFONO", key: "phone", width: 30 },
        { header: "CORREO ELECTRONICO", key: "email", width: 30 },
        { header: "DOMICILIO DE LA EMPRESA", key: "address", width: 30 },
        { header: "SEGUIMIENTO", key: "followup", width: 30 },
        { header: "Status", key: "status", width: 30 },
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

      // Agrega cada empresa al worksheet
      groupedData[employeeName].forEach((company) => {
        worksheet.addRow({
          company: company.company,
          contact: company.contact || "",
          phone: company.phone || "",
          email: company.email || "",
          address: company.address || "",
          followup: company.followup || "",
          status: company.status || "",
        });
      });
    }

    // Configura los encabezados de la respuesta para enviar el archivo
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=companies.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: error.message });
  }
});

//Ruta para actualziar una empresa
router.put("/update/:id", async (req, res) => {
  try {
    // Define el esquema de validación usando Joi
    const schema = Joi.object({
      company: VALIDATED_FIELDS.COMPANY.optional(),
      contact: VALIDATED_FIELDS.NAME.optional(),
      phone: Joi.string().allow(""), // Opcional,
      email: Joi.string().allow(""), // Opcional,
      address: VALIDATED_FIELDS.ADDRESS.optional(),
      followup: Joi.string().allow(""), // Opcional
      status: Joi.string().optional(),
      employeeId: Joi.string().optional(), // ID del empleado es opcional en actualización
    });

    // Validación de los datos de la solicitud
    await schema.validateAsync(req.body);
    // Llama al método update en CompanyController
    const result = await CompanyController.update(req.params.id, req.body);

    // Verifica si hubo un error en la actualización
    if (result.error) {
      return res.status(409).json({ message: result.error });
    }

    // Responde con éxito si la actualización fue exitosa
    res.status(200).json(result);
  } catch (error) {
    // Manejo de errores de validación o de ejecución
    res.status(400).json({ message: error.message });
  }
});

// Ruta para buscar empresas por estado
router.get("/byState", async (req, res) => {
  const result = await CompanyController.findByState(req.query);
  res.json(result);
});

// Ruta para obtener empresas por empleado
router.get("/byEmployee/:id", async (req, res) => {
  const result = await CompanyController.findByEmployee(req.params.id);
  res.json(result);
});

module.exports = router;
