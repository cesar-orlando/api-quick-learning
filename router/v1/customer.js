const { Router } = require("express");
const router = Router();
const excel = require("exceljs");
/* Components */
const customerController = require("../../controller/customer.controller");
const { MESSAGE_RESPONSE_CODE, MESSAGE_RESPONSE } = require("../../lib/constans");
const userController = require("../../controller/user.controller");

router.get("/allcustomers", async (req, res) => {
  try {
    const customers = await customerController.getAllCustom();
    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: "All customers", customers });
  } catch (error) {
    console.log(error);
  }
});

//Agregar cliente y asignarle un agente de forma aleatoria
router.post("/addcustomer", async (req, res) => {
  console.log("entra a la petición de addcustomer");
  try {
    const { name, phone, comments, classification, status, visitDetails, enrollmentDetails, user, ia } = req.body;

    const getUsers = await userController.findAll();
    // Asignar un agente de forma aleatoria
    const agentIndex = Math.floor(Math.random() * getUsers.length);
    const agent = getUsers[0];

    const validateUser = await customerController.findOneCustom({ phone: phone });
    if (validateUser) {
      return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: MESSAGE_RESPONSE.CUSTOMER_ALREADY_REGISTERED });
    }
    const customerData = await customerController.create({
      name: name,
      phone: phone,
      comments: comments,
      classification: classification,
      status: status,
      visitDetails: { branch: visitDetails.branch, date: visitDetails.date, time: visitDetails.time },
      enrollmentDetails: {
        consecutive: enrollmentDetails.consecutive,
        course: enrollmentDetails.course,
        modality: enrollmentDetails.modality,
        state: enrollmentDetails.state,
        email: enrollmentDetails.email,
        source: enrollmentDetails.source,
        paymentType: enrollmentDetails.paymentType,
      },
      user: user,
      ia: ia,
    });
    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: "Customer added", customerData });
  } catch (error) {
    console.log("error", error);
    return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: error.message });
  }
});


router.put("/updatecustomer", async (req, res) => {
  try {
    const { name, email, phone, whatsAppProfile, whatsAppNumber, ia, social, status } = req.body;

    const customerData = await customerController.updateOneCustom(
      { whatsAppNumber: whatsAppNumber },
      {
        name: name,
        email: email,
        phone: phone,
        whatsAppProfile: whatsAppProfile,
        whatsAppNumber: whatsAppNumber,
        ia: ia,
        social: social,
        status: status,
      }
    );
    if (!customerData) {
      return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: "Customer not found" });
    }
    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: "Customer updated", customerData });
  } catch (error) {
    console.log(error);
  }
});

/* Generate Excel with exceljs */
router.get("/downloadfile", async (req, res) => {
  try {
    const customers = await customerController.getAllCustom();
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("Customers");

    worksheet.columns = [
      { header: "Name", key: "name", width: 30 },
      { header: "Phone", key: "phone", width: 30 },
      { header: "Comments", key: "comments", width: 30 },
      { header: "Classification", key: "classification", width: 30 },
      { header: "Status", key: "status", width: 30 },
      { header: "Branch", key: "visitDetails.branch", width: 30 },
      { header: "Date", key: "visitDetails.date", width: 30 },
      { header: "Time", key: "visitDetails.time", width: 30 },
      { header: "Consecutive", key: "enrollmentDetails.consecutive", width: 30 },
      { header: "Course", key: "enrollmentDetails.course", width: 30 },
      { header: "Modality", key: "enrollmentDetails.modality", width: 30 },
      { header: "State", key: "enrollmentDetails.state", width: 30 },
      { header: "Email", key: "enrollmentDetails.email", width: 30 },
      { header: "Source", key: "enrollmentDetails.source", width: 30 },
      { header: "PaymentType", key: "enrollmentDetails.paymentType", width: 30 },
      { header: "User", key: "user", width: 30 },
      { header: "IA", key: "ia", width: 30 },
    ];

    // Apply styles to headers
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF008CFF" },
      };
      cell.font = {
        color: { argb: "FFFFFFFF" },
        bold: true,
        size: 12,
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF008CFF" } },
        left: { style: "thin", color: { argb: "FF008CFF" } },
        bottom: { style: "thin", color: { argb: "FF008CFF" } },
        right: { style: "thin", color: { argb: "FF008CFF" } },
      };
    });

    customers.forEach((customer) => {
      worksheet.addRow(customer);
    });
    const fileName = "customers.xlsx";
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=" + fileName);
    return workbook.xlsx.write(res).then(function () {
      res.end();
    });
  } catch (error) {
    console.log(error);
  }
});

/* Traer customers por el id del user */
router.get("/customersbyuser/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const customers = await customerController.getAllCustom();
    const customersByUser = customers.filter((customer) => customer.user == id);
    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: "Customers by user", customersByUser });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
