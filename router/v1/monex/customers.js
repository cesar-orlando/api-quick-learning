const { Router } = require("express");
const router = Router();
const Joi = require("joi");
const excel = require("exceljs");
const { VALIDATED_FIELDS, MESSAGE_RESPONSE_CODE, MESSAGE_RESPONSE } = require("../../../lib/constans");
const customerMonexController = require("../../../controller/monex/customers.controller");

/* crear clientes */
router.post("/", async (req, res) => {
  try {
    const schema = Joi.object({
      company: VALIDATED_FIELDS.NAME,
      email: VALIDATED_FIELDS.EMAIL,
      phone: VALIDATED_FIELDS.PHONE,
      country: VALIDATED_FIELDS.COUNTRY,
      status: VALIDATED_FIELDS.STATUS,
    });

    const { company, email, phone, country, status } = await schema.validateAsync(req.body);
    /* Validar si ya existe un cliente con el mismo email o company */
    const validateCustomer = await customerMonexController.findOneCustom({ email: email.toLowerCase() });
    const validateCompany = await customerMonexController.findOneCustom({ company: company.toLowerCase() });
    if (validateCustomer || validateCompany) {
      return res.status(MESSAGE_RESPONSE_CODE.UNPROCESSABLE_ENTITY).json({ message: MESSAGE_RESPONSE.COMPANY_IS_ALREADY_REGISTERED });
    }
    const data = {
      company,
      email,
      phone,
      country,
      status,
    };

    const customer = await customerMonexController.create(data);
    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: MESSAGE_RESPONSE.OK, customer });
  } catch (error) {
    return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: error.message });
  }
});

/* Crear customer por medio de un foreach de companies */
router.post("/companies", async (req, res) => {
  try {
    /*   const schema = Joi.object({
            companies: Joi.array().items(Joi.object({
                company: VALIDATED_FIELDS.NAME,
                //email: VALIDATED_FIELDS.EMAIL,
                //phone: VALIDATED_FIELDS.PHONE,
                //country: VALIDATED_FIELDS.COUNTRY,
                //status: VALIDATED_FIELDS.STATUS
            }))
        }); */

    // const { companies } = await schema.validateAsync(req.body);
    const { companies } = req.body;
    const data = companies.map((company) => {
      return {
        company: company.company,
        contact: company.contact,
        phone: company.phone,
        address: company.address,
        followup: company.followup,
        employee: company.employee,
        status: company.status ? company.status : 4,
      };
    });

    const customers = await customerMonexController.createMany(data);
    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: MESSAGE_RESPONSE.OK, customers });
  } catch (error) {
    return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: error.message });
  }
});

/* obtener todos los clientes */
router.get("/", async (req, res) => {
  try {
    const data = await customerMonexController.getAll();
    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: MESSAGE_RESPONSE.OK, data });
  } catch (error) {
    return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: error.message });
  }
});

/* export en un exceljs todos los clientes.  */
router.get("/export", async (req, res) => {
  try {
    const data = await customerMonexController.getAll();

    const workbook = new excel.Workbook();

    // Group data by employee
    const groupedData = data.reduce((acc, item) => {
      (acc[item.employee] = acc[item.employee] || []).push(item);
      return acc;
    }, {});

    // Create a worksheet for each employee
    for (const employee in groupedData) {
        if (!employee) {
            console.log('Skipping empty employee name');
            continue;
        }
      const worksheet = workbook.addWorksheet(employee);
      
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

      worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
        row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
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
          for (let i = 0; i < rowNumber.length; i++) {
            const element = rowNumber[i];
            row.getCell(element).fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "C7C7C7" },
            };
            row.getCell(element).border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          }
        });
      });

      groupedData[employee].forEach((customer) => {
        /* Pendiente ver para agregar diseño a las demas celdas. */
        worksheet.addRow({
          company: customer.company,
          contact: customer.contact,
          phone: customer.phone,
          address: customer.address,
          followup: customer.followup,
          status: customer.status,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
        });
      });
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=customers.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: error.message });
  }
});

/* obtener un cliente por id */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await customerMonexController.findById(id);
    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: MESSAGE_RESPONSE.OK, data });
  } catch (error) {
    return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: error.message });
  }
});

/* actualizar un cliente por id */
router.put("/:id", async (req, res) => {
  try {
    const schema = Joi.object({
      company: VALIDATED_FIELDS.NAME,
      email: VALIDATED_FIELDS.EMAIL,
      phone: VALIDATED_FIELDS.PHONE,
      country: VALIDATED_FIELDS.COUNTRY,
      status: VALIDATED_FIELDS.STATUS,
    });

    const { company, email, phone, country, status } = await schema.validateAsync(req.body);
    const data = {
      company,
      email,
      phone,
      country,
      status,
    };

    const { id } = req.params;
    const customer = await customerMonexController.update(id, data);
    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: MESSAGE_RESPONSE.OK, customer });
  } catch (error) {
    return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: error.message });
  }
});

module.exports = router;
