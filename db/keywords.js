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
  
    // Error o número equivocado
    "número equivocado": { classification: "Número equivocado", status: "No contesta" },
    "no soy": { classification: "Número equivocado", status: "No contesta" },
    "quién eres": { classification: "Número equivocado", status: "No contesta" },
  
    // Renovación
    "ya soy alumno": { classification: "Alumno", status: "Renovación" },
    "renovar": { classification: "Alumno", status: "Renovación" },
    "quiero continuar": { classification: "Alumno", status: "Renovación" },
  
    // Consultas generales
    "quiero saber más": { classification: "Prospecto", status: "En conversación" },
    "me gustaría saber": { classification: "Prospecto", status: "En conversación" },
    "qué incluye": { classification: "Prospecto", status: "En conversación" },
    "tienen promoción": { classification: "Prospecto", status: "Inscrito con promoción" },
  
    // Servicios
    "ofrezco un servicio": { classification: "Ofrece servicios", status: "Otros" },
    "vendo": { classification: "Ofrece servicios", status: "Otros" },
    "trabajo en": { classification: "Ofrece servicios", status: "Otros" },
    "soy proveedor": { classification: "Ofrece servicios", status: "Otros" },

    //No contesta
    "no contesta": { classification: "No contesta", status: "Sin interacción" },
  };

  module.exports = keywordClassification;