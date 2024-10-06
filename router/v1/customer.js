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

router.post("/addcustomer", async (req, res) => {
  const data3 = [
    {
      _id: "66d8d63580603f7914e0ba5d",
      name: "Sandra Martínez",
      email: "sandramartinez@gmail.com",
      phone: "5213323456788",
      whatsAppProfile: "Sandra Martínez",
      whatsAppNumber: "whatsapp:+5213323456788",
      social: "LinkedIn",
      status: 1,
      ia: true,
      date: "2024-09-04T21:50:45.094Z",
      __v: 0,
    },
    {
      _id: "66d8d63580603f7914e0ba5e",
      name: "Alberto Sánchez",
      email: "albertosanchez@gmail.com",
      phone: "5213398765436",
      whatsAppProfile: "Alberto Sánchez",
      whatsAppNumber: "whatsapp:+5213398765436",
      social: "Instagram",
      status: 3,
      ia: true,
      date: "2024-09-04T21:50:45.094Z",
      __v: 0,
    },
    {
      _id: "66d8d63580603f7914e0ba5f",
      name: "Verónica Ramírez",
      email: "veronicaramirez@gmail.com",
      phone: "5213345678907",
      whatsAppProfile: "Verónica Ramírez",
      whatsAppNumber: "whatsapp:+5213345678907",
      social: "Facebook",
      status: 2,
      ia: true,
      date: "2024-09-04T21:50:45.094Z",
      __v: 0,
    },
    {
      _id: "66d8d63580603f7914e0ba60",
      name: "Miguel López",
      email: "miguellopez@gmail.com",
      phone: "5213310987658",
      whatsAppProfile: "Miguel López",
      whatsAppNumber: "whatsapp:+5213310987658",
      social: "Twitter",
      status: 1,
      ia: true,
      date: "2024-09-04T21:50:45.094Z",
      __v: 0,
    },
    {
      _id: "66d8d63580603f7914e0ba5a",
      name: "Manuel Herrera",
      email: "manuelherrera@gmail.com",
      phone: "5213356789014",
      whatsAppProfile: "Manuel Herrera",
      whatsAppNumber: "whatsapp:+5213356789014",
      social: "Twitter",
      status: 1,
      ia: true,
      date: "2024-09-04T21:50:45.093Z",
      __v: 0,
    },
    {
      _id: "66d8d63580603f7914e0ba5b",
      name: "Alma Pérez",
      email: "almaperez@gmail.com",
      phone: "5213312345674",
      whatsAppProfile: "Alma Pérez",
      whatsAppNumber: "whatsapp:+5213312345674",
      social: "Instagram",
      status: 3,
      ia: true,
      date: "2024-09-04T21:50:45.093Z",
      __v: 0,
    },
    {
      _id: "66d8d63580603f7914e0ba5c",
      name: "Jorge López",
      email: "jorgelopez@gmail.com",
      phone: "5213345678903",
      whatsAppProfile: "Jorge López",
      whatsAppNumber: "whatsapp:+5213345678903",
      social: "Facebook",
      status: 2,
      ia: true,
      date: "2024-09-04T21:50:45.093Z",
      __v: 0,
    },
    {
      _id: "66d8d63580603f7914e0ba56",
      name: "Esteban Torres",
      email: "estebantorres@gmail.com",
      phone: "5213312345670",
      whatsAppProfile: "Esteban Torres",
      whatsAppNumber: "whatsapp:+5213312345670",
      social: "LinkedIn",
      status: 2,
      ia: true,
      date: "2024-09-04T21:50:45.092Z",
      __v: 0,
    },
    {
      _id: "66d8d63580603f7914e0ba57",
      name: "Paula Guzmán",
      email: "paulaguzman@gmail.com",
      phone: "5213334567892",
      whatsAppProfile: "Paula Guzmán",
      whatsAppNumber: "whatsapp:+5213334567892",
      social: "Facebook",
      status: 1,
      ia: true,
      date: "2024-09-04T21:50:45.092Z",
      __v: 0,
    },
    {
      _id: "66d8d63580603f7914e0ba58",
      name: "Sebastián Lara",
      email: "sebastianlara@gmail.com",
      phone: "5213310987655",
      whatsAppProfile: "Sebastián Lara",
      whatsAppNumber: "whatsapp:+5213310987655",
      social: "Instagram",
      status: 3,
      ia: true,
      date: "2024-09-04T21:50:45.092Z",
      __v: 0,
    },
    {
      _id: "66d8d63580603f7914e0ba59",
      name: "Julia Ortega",
      email: "juliaortega@gmail.com",
      phone: "5213398765435",
      whatsAppProfile: "Julia Ortega",
      whatsAppNumber: "whatsapp:+5213398765435",
      social: "LinkedIn",
      status: 2,
      ia: true,
      date: "2024-09-04T21:50:45.092Z",
      __v: 0,
    },
    {
      _id: "66d8d63580603f7914e0ba55",
      name: "Raquel Morales",
      email: "raquelmorales@gmail.com",
      phone: "5213345678910",
      whatsAppProfile: "Raquel Morales",
      whatsAppNumber: "whatsapp:+5213345678910",
      social: "Instagram",
      status: 3,
      ia: true,
      date: "2024-09-04T21:50:45.090Z",
      __v: 0,
    },
    {
      _id: "66d8d5f06845e0452675a04e",
      name: "Cesar Orlando",
      email: "",
      phone: "+5213322155070",
      whatsAppProfile: "Cesar Orlando",
      whatsAppNumber: "whatsapp:+5213322155070",
      social: "Google",
      status: 3,
      ia: true,
      date: "2024-09-04T21:49:36.592Z",
      __v: 0,
    },
    {
      _id: "66d8d5f06845e0452675a04f",
      name: "Cesar Orlando",
      email: "cesar4@cesar4.com",
      phone: "5214521311888",
      whatsAppProfile: "Cesar Orlando",
      whatsAppNumber: "whatsapp:+5214521311888",
      social: "Instagram",
      status: 3,
      ia: true,
      date: "2024-09-04T21:49:36.592Z",
      __v: 0,
    },
    {
      _id: "66d8d5f06845e0452675a050",
      name: "Mariana López",
      email: "marianalopez@gmail.com",
      phone: "5213312345678",
      whatsAppProfile: "Mariana López",
      whatsAppNumber: "whatsapp:+5213312345678",
      social: "Instagram",
      status: 2,
      ia: true,
      date: "2024-09-04T21:49:36.592Z",
      __v: 0,
    },
    {
      _id: "66d8d5f06845e0452675a051",
      name: "Carlos Martínez",
      email: "carlosmartinez@gmail.com",
      phone: "5213345678901",
      whatsAppProfile: "Carlos Mtz",
      whatsAppNumber: "whatsapp:+5213345678901",
      social: "Twitter",
      status: 1,
      ia: true,
      date: "2024-09-04T21:49:36.592Z",
      __v: 0,
    },
    {
      _id: "66d8d5f06845e0452675a04b",
      name: "EG",
      email: "",
      phone: "5213339685704",
      whatsAppProfile: "EG",
      whatsAppNumber: "whatsapp:+5213339685704",
      social: "Instagram",
      status: 3,
      ia: true,
      date: "2024-09-04T21:49:36.591Z",
      __v: 0,
    },
    {
      _id: "66d8d5f06845e0452675a04c",
      name: "Jennifer 👩🏻‍⚕️",
      email: "jenni_ss01@gmail.com",
      phone: "5214525186936",
      whatsAppProfile: "Jennifer 👩🏻‍⚕️",
      whatsAppNumber: "whatsapp:+5214525186936",
      social: "Instagram",
      status: 3,
      ia: true,
      date: "2024-09-04T21:49:36.591Z",
      __v: 0,
    },
    {
      _id: "66d8d5f06845e0452675a04d",
      name: "Quick Learning",
      email: "",
      phone: "5213339561099",
      whatsAppProfile: "Quick Learning",
      whatsAppNumber: "whatsapp:+5213339561099",
      social: "Facebook",
      status: 3,
      ia: true,
      date: "2024-09-04T21:49:36.591Z",
      __v: 0,
    },
    {
      _id: "66d8d5f06845e0452675a04a",
      name: "Serge",
      email: "",
      phone: "5213328322708",
      whatsAppProfile: "Serge",
      whatsAppNumber: "whatsapp:+5213328322708",
      social: "Facebook",
      status: 3,
      ia: true,
      date: "2024-09-04T21:49:36.590Z",
      __v: 0,
    },
    {
      _id: "66d8d5f06845e0452675a049",
      name: "Liliana🌻",
      email: "",
      phone: "5215528154880",
      whatsAppProfile: "Liliana🌻",
      whatsAppNumber: "whatsapp:+5215528154880",
      social: "Facebook",
      status: 3,
      ia: true,
      date: "2024-09-04T21:49:36.590Z",
      __v: 0,
    },
    {
      _id: "66d8d5f06845e0452675a046",
      name: "Edith",
      email: "",
      phone: "5213334576168",
      whatsAppProfile: "Edith",
      whatsAppNumber: "whatsapp:+5213334576168",
      social: "Google",
      status: 3,
      ia: true,
      date: "2024-09-04T21:49:36.589Z",
      __v: 0,
    },
    {
      _id: "66d8d5f06845e0452675a047",
      name: "Erika",
      email: "",
      phone: "5213313127975",
      whatsAppProfile: "Erika",
      whatsAppNumber: "whatsapp:+5213313127975",
      social: "Instagram",
      status: 3,
      ia: true,
      date: "2024-09-04T21:49:36.589Z",
      __v: 0,
    },
    {
      _id: "66d8d5f06845e0452675a048",
      name: "Dani Comparan 🙌🏻",
      email: "",
      phone: "5213322561236",
      whatsAppProfile: "Dani Comparan 🙌🏻",
      whatsAppNumber: "whatsapp:+5213322561236",
      social: "Facebook",
      status: 3,
      ia: true,
      date: "2024-09-04T21:49:36.589Z",
      __v: 0,
    },
    {
      _id: "66d8d5f06845e0452675a045",
      name: "Jetro Daniel Onofre",
      email: "jetrodanielonofre@gmail.com",
      phone: "5213334576168",
      whatsAppProfile: "Jetro Onofre",
      whatsAppNumber: "whatsapp:+5213329255075",
      social: "Facebook",
      status: 3,
      ia: true,
      date: "2024-09-04T21:49:36.587Z",
      __v: 0,
    },
  ];

  try {
    const { name, email, phone, whatsAppProfile, whatsAppNumber, ia, social, country, status } = req.body;

    /*   data3.forEach(async (element) => {
        const getUsers = await userController.findAll();
        // Asignar un agente de forma aleatoria
        const agentIndex = Math.floor(Math.random() * getUsers.length);
        const agent = getUsers[agentIndex];
            
        const agentObj = {
            agentId: agent._id,
            name: agent.name,
        };
        const data = {
            name: element.name,
            email: element.email,
            phone: element.phone,
            whatsAppProfile: element.whatsAppProfile,
            whatsAppNumber: element.whatsAppNumber,
            status: element.status,
            ia: element.ia,
            social: element.social,
            agent: agentObj,
            country: element.country
        };

        const response = await customerController.create(data);
        console.log("response --->", response);
    });

    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: "Customers added" }); */

    const getUsers = await userController.findAll();
    // Asignar un agente de forma aleatoria
    const agentIndex = Math.floor(Math.random() * getUsers.length);
    const agent = getUsers[agentIndex];

    const agentObj = {
      agentId: agent._id,
      name: agent.name,
    };

    const validateUser = await customerController.findOneCustom({ whatsAppNumber: whatsAppNumber });
    if (validateUser) {
      return res.status(MESSAGE_RESPONSE_CODE.BAD_REQUEST).json({ message: MESSAGE_RESPONSE.CUSTOMER_ALREADY_REGISTERED });
    }
    const customerData = await customerController.create({
      name: name,
      email: email,
      phone: phone,
      whatsAppProfile: whatsAppProfile,
      whatsAppNumber: whatsAppNumber,
      ia: ia,
      social: social,
      agent: agentObj,
      country: country,
      status: status,
    });
    return res.status(MESSAGE_RESPONSE_CODE.OK).json({ message: "Customer added", customerData });
  } catch (error) {
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
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 30 },
      { header: "WhatsApp Profile", key: "whatsAppProfile", width: 30 },
      { header: "WhatsApp Number", key: "whatsAppNumber", width: 30 },
      { header: "IA", key: "ia", width: 30 },
      { header: "Social", key: "social", width: 30 },
      { header: "Country", key: "country", width: 30 },
      { header: "Status", key: "status", width: 30 },
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

module.exports = router;
