const { Router } = require("express");
const router = Router();
const customerController = require("../../../controller/quicklearning/customer.controller");


/* Traer todos los clientes divididor por status en el total de cada uno */
router.get("/status", async (req, res) => {
    try {
      const customers = await customerController.getAllCustom();
      const totalCustomers = customers.length;
      const status = {
        "En conversación": 0,
        "Renovación": 0, 
        "No contesta": 0, 
        "Interesado": 0, 
        "Alerta": 0, 
        "Sin interacción": 0, 
        "Listo para venta": 0,
        "Prospecto": 0,
        "En revisión": 0,
        "Inscrito": 0,
        "Alumno": 0,
        "No contesta": 0,
        "Número equivocado": 0,
        "Ofrece servicios": 0,
        "Otros": 0,
      };
  
      customers.forEach((customer) => {
        status[customer.status] += 1;
      });
  
      res.status(200).json({ message: "Status of all customers", totalCustomers, status });
    } catch (error) {
      console.error("❌ Error al obtener el estado de los clientes:", error);
      res.status(500).json({ message: "Error al obtener el estado de los clientes." });
    }
  });