const keywordClassification = {
// Interés en cursos
"quiero información": { classification: "Prospecto", status: "Interesado" },
"me interesa": { classification: "Prospecto", status: "Interesado" },   
"cursos": { classification: "Prospecto", status: "Interesado" },
"inglés": { classification: "Prospecto", status: "Interesado" },
"curso": { classification: "Prospecto", status: "Interesado" },
"quiero inscribirme": { classification: "Prospecto", status: "Interesado" },
"horarios": { classification: "Prospecto", status: "Interesado" },
"intensivo": { classification: "Prospecto", status: "Interesado" },
"semi intensivo": { classification: "Prospecto", status: "Interesado" },
"virtual": { classification: "Prospecto", status: "Interesado" },
"Descuento": { classification: "Prospecto", status: "Interesado" },
"descuentos":  { classification: "Prospecto", status: "Interesado" },
"Barato": { classification: "Prospecto", status: "Interesado" },
"Requisitos": { classification: "Prospecto", status: "Interesado" },
"cuando inicia el curso": { classification: "Prospecto", status: "Interesado" },
"tienen promoción": { classification: "Prospecto", status: "Interesado" },
"online": { classification: "Prospecto", status: "Interesado" },
"inicio de clases":  { classification: "Prospecto", status: "Interesado" },
"niños": { classification: "Prospecto", status: "Interesado" },
"menor de edad": { classification: "Prospecto", status: "Interesado" },
"Duración de los cursos": { classification: "Prospecto", status: "Interesado" },
"Cuanto duran": { classification: "Prospecto", status: "Interesado" },


// Costo y precio
"cuál es el precio": { classification: "Prospecto", status: "En conversación" },
"costo": { classification: "Prospecto", status: "En conversación" },
"costos": { classification: "Prospecto", status: "En conversación" },
"muy caro": { classification: "No interesado por precio", status: "No contesta" },
"es caro": { classification: "No interesado por precio", status: "No contesta" },


// No interesado
"no me interesa": { classification: "No interesado por precio", status: "No contesta" },
"gracias pero no": { classification: "No interesado por precio", status: "No contesta" },
"ya tengo otro curso": { classification: "No interesado por precio", status: "No contesta" },
"no ahora": { classification: "No interesado por precio", status: "No contesta" },
"otros idomas": { classification: "No interesado por precio", status: "No contesta" },


// Error o número equivocado
"número equivocado": { classification: "Número equivocado", status: "No contesta" },
"no soy": { classification: "Número equivocado", status: "No contesta" },
"quién eres": { classification: "Número equivocado", status: "No contesta" },
"no me interesa": { classification: "Número equivocado", status: "No contesta" },
"Yo no pedi información": { classification: "Número equivocado", status: "No contesta" },


// Renovación
"ya soy alumno": { classification: "Alumno", status: "Renovación" },
"renovar": { classification: "Alumno", status: "Renovación" },
"quiero continuar": { classification: "Alumno", status: "Renovación" },
"Quiero pagar": { classification: "Alumno", status: "Renovación" },
"donde pago" : { classification: "Alumno", status: "Renovación" },
"Cuando me toca pagar": { classification: "Prospecto", status: "Interesado" },


// Consultas generales
"quiero saber más": { classification: "Prospecto", status: "En conversación" },
"me gustaría saber": { classification: "Prospecto", status: "En conversación" },
"qué incluye": { classification: "Prospecto", status: "En conversación" },
"Donde esta la sucursal": { classification: "Prospecto", status: "En conversación" },
"Ya soy alumno": { classification: "Alumno", status: "Renovación" },


// Servicios
"ofrezco un servicio": { classification: "Ofrece servicios", status: "Otros" },
"vendo": { classification: "Ofrece servicios", status: "Otros" },
"trabajo en": { classification: "Ofrece servicios", status: "Otros" },
"soy proveedor": { classification: "Ofrece servicios", status: "Otros" },
"Colaboracion": { classification: "Ofrece servicios", status: "Otros" },
"Colaborar": { classification: "Ofrece servicios", status: "Otros" },
"Busco trabajo": { classification: "Ofrece servicios", status: "Otros" },
"Reclutamiento": { classification: "Ofrece servicios", status: "Otros" },
"Recursos humanos": { classification: "Ofrece servicios", status: "Otros" },
"Invitarlos": { classification: "Ofrece servicios", status: "Otros" },



//No contesta
"no contesta": { classification: "No contesta", status: "Sin interacción"},


// Quejas
"Profeco": { classification: "Urgente", status: "Queja"},
"Demanda": { classification: "Urgente", status: "Queja"},
"Abuso": { classification: "Urgente", status: "Queja"},
"Robo": { classification: "Urgente", status: "Queja"},
"Grosero": { classification: "Urgente", status: "Queja"},
"Me trataron mal": { classification: "Urgente", status: "Queja"},
"Acoso": { classification: "Urgente", status: "Queja"},
"Pesimo servicio": { classification: "Urgente", status: "Queja"},
"Mala experiencia": { classification: "Urgente", status: "Queja"},
"Los voy a demandar": { classification: "Urgente", status: "Queja"},
"Abogados": { classification: "Urgente", status: "Queja"},
"Mala experiencia": { classification: "Urgente", status: "Queja"},
"Maltrato": { classification: "Urgente", status: "Queja"},
"estafa": { classification: "Urgente", status: "Queja"},
"fraude": { classification: "Urgente", status: "Queja"},
"Me mintieron": { classification: "Urgente", status: "Queja"},
"Me engañaron": { classification: "Urgente", status: "Queja"},
"Me robaron": { classification: "Urgente", status: "Queja"},
"Me hicieron un cargo": { classification: "Urgente", status: "Queja"},
  };

  module.exports = keywordClassification;