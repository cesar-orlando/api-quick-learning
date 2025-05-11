import axios from "axios";
import { User } from "../models/user.model"; // Modelo para los usuarios
import { DynamicRecord } from "../models/record.model";
import geolib from "geolib"; // Biblioteca para calcular distancias

export const get_start_dates = async (requestedDate = null, isGenericRequest = false) => {
  try {
    // Configuración de la petición al API
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: "http://localhost:10000/api/v1/datecourses",
      headers: {},
    };

    // Petición al API
    const response = await axios.request(config);

    // Obtener la fecha de hoy
    const today = new Date();

    // Filtrar solo los cursos de "Semana 1" que sean futuros
    let startCourses = response.data.dateCourses
      .filter((course: any) => course.type === 1 && new Date(course.date) >= today)
      .map((course: any) => new Date(course.date)) // Convertimos las fechas a objetos Date
      .sort((a: any, b: any) => a - b); // Ordenamos las fechas de menor a mayor

    if (startCourses.length === 0) {
      return "No hay semanas de inicio de curso programadas en las próximas fechas.";
    }

    // Agrupar por semanas exactas de inicio
    let weeks: any = [];
    let currentWeek: any = [];

    startCourses.forEach((date: any, index: any) => {
      if (currentWeek.length === 0) {
        currentWeek.push(date);
      } else {
        let lastDate = currentWeek[currentWeek.length - 1];
        let diffDays = (date - lastDate) / (1000 * 60 * 60 * 24); // Diferencia en días

        if (diffDays === 1) {
          currentWeek.push(date);
        } else {
          weeks.push([...currentWeek]); // Guardamos la semana anterior
          currentWeek = [date]; // Empezamos una nueva semana
        }
      }

      // Agregar la última semana acumulada
      if (index === startCourses.length - 1) {
        weeks.push([...currentWeek]);
      }
    });

    // **1. Si es una consulta genérica (Ej: "¿Qué otras fechas tienes?")**
    if (isGenericRequest) {
      return "📢 ¿Para qué fecha te gustaría empezar? Puedo revisar las semanas disponibles a partir de ese mes o día específico. 😊";
    }

    // **2. Si el cliente NO ha solicitado una fecha específica, mostrar solo la PRÓXIMA semana**
    if (!requestedDate) {
      const firstWeek = weeks[0];
      const start = firstWeek[0].toLocaleDateString("es-ES");
      const end = firstWeek[firstWeek.length - 1].toLocaleDateString("es-ES");

      return `📢 ¡Tenemos cupo disponible para la próxima semana de inicio de curso!\n📅 *${start} - ${end}*\n\n🎯 No pierdas la oportunidad de empezar tu aprendizaje cuanto antes. ¿Te gustaría que te ayude con tu inscripción ahora mismo?`;
    }

    // **3. Si el cliente proporciona una fecha, mostrar semanas después de esa fecha**
    let requestedDateObj = new Date(requestedDate);
    let filteredWeeks = weeks.filter((week: any) => week[0] >= requestedDateObj);

    if (filteredWeeks.length === 0) {
      return "No hay semanas de inicio disponibles después de la fecha indicada.";
    }

    let message = "Estas son las próximas semanas de inicio de curso disponibles:\n";
    filteredWeeks.forEach((week: any) => {
      const start = week[0].toLocaleDateString("es-ES");
      const end = week[week.length - 1].toLocaleDateString("es-ES");
      message += `📅 ${start} - ${end}\n`;
    });

    return `${message}\n📢 ¡Aprovecha tu lugar antes de que se agoten los cupos! ¿Te ayudo a asegurar tu inscripción ahora mismo?`;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error al obtener las semanas de inicio de cursos:", error.message);
    } else {
      console.error("Error al obtener las semanas de inicio de cursos:", error);
    }
    return "No pude obtener la información de inicio de cursos en este momento. Inténtalo más tarde.";
  }
};

export const register_user_name = async (full_name: string, WaId: string): Promise<string> => {
  try {
    // Obtener todos los usuarios disponibles
    const users = await User.find();
    if (users.length === 0) {
      throw new Error("No hay usuarios disponibles para asignar.");
    }

    // Seleccionar un usuario aleatorio
    const agentIndex = Math.floor(Math.random() * users.length);
    const agent = users[agentIndex];

    // Actualizar el cliente en la tabla de prospectos
    const updatedCustomer = await DynamicRecord.findOneAndUpdate(
      {
        tableSlug: "prospectos", // Asegurarse de que el registro pertenece a la tabla "prospectos"
        customFields: { $elemMatch: { key: "phone", value: WaId } }, // Buscar por el número de teléfono
      },
      {
        $set: {
          "customFields.$[nameField].value": full_name,
          "customFields.$[statusField].value": "Interesado",
          "customFields.$[classificationField].value": "Prospecto",
          "customFields.$[userField].value": JSON.stringify({ name: agent.name, _id: agent._id }), // Asignar el usuario con el formato requerido
          "customFields.$[aiField].value": false,
        },
      },
      {
        arrayFilters: [
          { "nameField.key": "name" },
          { "statusField.key": "status" },
          { "classificationField.key": "classification" },
          { "userField.key": "user" },
          { "aiField.key": "ai" },
        ],
        new: true, // Retornar el documento actualizado
      }
    );

    if (!updatedCustomer) {
      throw new Error("No se encontró el cliente en la tabla de prospectos.");
    }

    console.log("✅ Cliente actualizado exitosamente:", updatedCustomer);

    return `¡Gracias, ${full_name}! Ahora que tengo tu nombre, puedo continuar con el proceso de inscripción. ¿Me puedes proporcionar tu número de contacto?`;
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Error al registrar el nombre del usuario:", error.message);
    } else {
      console.error("❌ Error al registrar el nombre del usuario:", error);
    }
    return "Hubo un problema al registrar tu nombre. Por favor, inténtalo de nuevo más tarde.";
  }
};

export const submit_student_complaint = async (issueDetails: string, WaId: string): Promise<string> => {
  try {
    // Obtener todos los usuarios disponibles
    const users = await User.find();
    if (users.length === 0) {
      throw new Error("No hay usuarios disponibles para asignar.");
    }

    // Seleccionar un usuario aleatorio
    const agentIndex = Math.floor(Math.random() * users.length);
    const agent = users[agentIndex];

    // Buscar al cliente en la tabla de prospectos
    const customer = await DynamicRecord.findOne({
      tableSlug: "prospectos",
      customFields: { $elemMatch: { key: "phone", value: WaId } },
    });

    if (!customer) {
      throw new Error("No se encontró el cliente en la tabla de prospectos.");
    }

    // Crear un nuevo registro en la tabla de problemas
    const newProblem = new DynamicRecord({
      tableSlug: "problemas", // Tabla de problemas
      customFields: [
        ...customer.customFields, // Copiar los datos del cliente
        { key: "issueDetails", label: "Detalles del Problema", value: issueDetails, type: "text" },
        { key: "status", label: "Estado", value: "Queja", type: "select" },
        { key: "classification", label: "Clasificación", value: "Urgente", type: "select" },
        { key: "user", label: "Asesor Asignado", value: JSON.stringify({ name: agent.name, _id: agent._id }), type: "text" }, // Asignar el usuario con el formato requerido
        { key: "ai", label: "AI", value: false, type: "text" },
      ],
    });

    await newProblem.save();

    // Eliminar al cliente de la tabla de prospectos
    await DynamicRecord.deleteOne({
      tableSlug: "prospectos",
      customFields: { $elemMatch: { key: "phone", value: WaId } },
    });

    console.log("✅ Cliente movido a la tabla de problemas y eliminado de prospectos.");

    return `⚠️ *Lamentamos escuchar esto.* Queremos ayudarte lo más rápido posible. Para dar seguimiento a tu reporte, por favor envíanos la siguiente información:\n\n📝 *Nombre completo*\n🏫 *Sucursal donde estás inscrito*\n📚 *Curso que estás tomando*\n⏰ *Horario en el que asistes*\n📢 *Detalles del problema:* "${issueDetails}"\n🎫 *Número de alumno*\n\nCon esta información, nuestro equipo podrá revisar tu caso y darte una solución lo antes posible. ¡Estamos para ayudarte! 😊`;
  } catch (error) {
    console.error("❌ Error al registrar la queja del cliente:", (error as any).message);
    return "Hubo un problema al registrar tu queja. Por favor, inténtalo de nuevo más tarde.";
  }
};

export const suggest_branch_or_virtual_course = async (city: string, WaId: string): Promise<string> => {
  try {
    // Obtener las sedes desde la tabla "sedes"
    const branches = await DynamicRecord.find({
      tableSlug: "sedes",
      customFields: { $elemMatch: { key: "status", value: "activo" } },
    });

    if (!branches || branches.length === 0) {
      throw new Error("No se encontraron sedes activas.");
    }

    // Normalizar la ciudad para la búsqueda
    const normalizedCity = city.trim().toLowerCase();

    // Buscar una sede que coincida con la ciudad
    const foundBranch = branches.find((branch: any) => {
      const cityField = branch.customFields.find((field: any) => field.key === "Ciudad");
      return cityField && cityField.value.toLowerCase().includes(normalizedCity);
    });

    if (foundBranch) {
      const nameField = foundBranch.customFields.find((field: any) => field.key === "nombre");
      const locationField = foundBranch.customFields.find((field: any) => field.key === "ubicación");
      const googleMapsField = foundBranch.customFields.find((field: any) => field.key === "link de googlemaps");

      return `📍 ¡Qué bonito lugar! Tenemos una sucursal en tu ciudad:\n\n🏫 *${nameField?.value}*\n📍 Dirección: ${locationField?.value}\n🌐 Google Maps: ${googleMapsField?.value}\n\n¿Cómo te gustaría aprender inglés? Contamos con tres modalidades:\n\n1. Presencial – Asistes físicamente a la escuela.\n2. Virtual (a distancia) – Clases en vivo por videollamada.\n3. Online – Plataforma autogestionada a tu ritmo, sin horarios.\n\n¿Cuál prefieres?`;
    } else {
      // Si no se encuentra una sucursal, asignar un asesor y desactivar la IA
      const users = await User.find();
      if (users.length === 0) {
        throw new Error("No hay usuarios disponibles para asignar.");
      }

      const agentIndex = Math.floor(Math.random() * users.length);
      const agent = users[agentIndex];

      await DynamicRecord.findOneAndUpdate(
        { tableSlug: "prospectos", customFields: { $elemMatch: { key: "phone", value: WaId } } },
        {
          $set: {
            "customFields.$[classificationField].value": "Prospecto",
            "customFields.$[statusField].value": "Interesado",
            "customFields.$[userField].value": JSON.stringify({ name: agent.name, _id: agent._id }), // Asignar el usuario con el formato requerido
            "customFields.$[aiField].value": false,
          },
        },
        {
          arrayFilters: [
            { "classificationField.key": "classification" },
            { "statusField.key": "status" },
            { "userField.key": "user" },
            { "aiField.key": "ai" },
          ],
          new: true,
        }
      );

      return `🤖 ¡Qué padre, ${city} es un lugar hermoso! Actualmente no tenemos una sucursal presencial ahí, pero no te preocupes...\n\n🎯 Tenemos dos opciones increíbles para ti:\n1. **Virtual** – Clases en vivo por videollamada con maestros certificados.\n2. **Online** – Aprende a tu propio ritmo con nuestra plataforma 24/7.\n\n📲 Ambas opciones son súper efectivas y puedes tomarlas desde la comodidad de tu casa.\n\n¿Te gustaría que te cuente más detalles para que elijas la que mejor se adapta a ti?`;
    }
  } catch (error) {
    console.error("Error al obtener sedes:", (error as any).message);
    return "No pude verificar las sedes en este momento, pero si me dices tu ciudad, puedo ayudarte manualmente.";
  }
};

export const suggest_nearby_branch = async (params: any, WaId: string): Promise<string> => {
  try {
    // Obtener las sedes activas desde la tabla "sedes"
    const branches = await DynamicRecord.find({
      tableSlug: "sedes",
      customFields: { $elemMatch: { key: "status", value: "activo" } },
    });

    if (!branches || branches.length === 0) {
      throw new Error("No se encontraron sedes activas.");
    }

    let userCoords;

    // 📍 Si vienen coordenadas, las usamos directamente
    if (params.lat && params.lng) {
      userCoords = {
        latitude: parseFloat(params.lat),
        longitude: parseFloat(params.lng),
      };
    } else if (params.address) {
      // 🗺️ Si viene una dirección, la geocodificamos
      const geo = await axios.get("http://api.positionstack.com/v1/forward", {
        params: {
          access_key: process.env.POSITIONSTACK_API_KEY,
          query: params.address,
          limit: 1,
          country: "MX",
        },
      });

      if (!geo.data.data.length) {
        return "No pude encontrar tu ubicación exacta. ¿Puedes darme una dirección más específica?";
      }

      userCoords = {
        latitude: geo.data.data[0].latitude,
        longitude: geo.data.data[0].longitude,
      };
    } else {
      return "Necesito una dirección o ubicación para poder ayudarte.";
    }

    // 🌍 Geolocalizar sucursales
    const branchesWithCoords = branches.map((branch: any) => {
      const locationField = branch.customFields.find((field: any) => field.key === "ubicación");
      const latField = branch.customFields.find((field: any) => field.key === "lat");
      const lngField = branch.customFields.find((field: any) => field.key === "lng");

      if (locationField && latField && lngField) {
        return {
          ...branch,
          lat: parseFloat(latField.value),
          lng: parseFloat(lngField.value),
        };
      }
      return null;
    }).filter((branch: any) => branch !== null);

    const sedesConDistancia = branchesWithCoords.map((sede: any) => ({
      ...sede,
      distance: geolib.getDistance(userCoords, {
        latitude: sede.lat,
        longitude: sede.lng,
      }),
    }));

    const topSedes = sedesConDistancia
      .sort((a: any, b: any) => a.distance - b.distance)
      .slice(0, 3);

    if (topSedes.length > 0) {
      const lista = topSedes
        .map((s: any, i: number) => {
          const nameField = s.customFields.find((field: any) => field.key === "nombre");
          const locationField = s.customFields.find((field: any) => field.key === "ubicación");
          return `*${i + 1}.* ${nameField?.value}\n📍 ${locationField?.value}`;
        })
        .join("\n\n");

      return `Estas son las sucursales más cercanas a ti:\n\n${lista}\n\n¿Te gustaría que te dé los horarios o modalidades que manejan en esta sucursal?`;
    } else {
      // Si no se encuentran sucursales cercanas, asignar un asesor y desactivar la IA
      const users = await User.find();
      if (users.length === 0) {
        throw new Error("No hay usuarios disponibles para asignar.");
      }

      const agentIndex = Math.floor(Math.random() * users.length);
      const agent = users[agentIndex];

      await DynamicRecord.findOneAndUpdate(
        { tableSlug: "prospectos", customFields: { $elemMatch: { key: "phone", value: WaId } } },
        {
          $set: {
            "customFields.$[classificationField].value": "Prospecto",
            "customFields.$[statusField].value": "Interesado",
            "customFields.$[userField].value": JSON.stringify({ name: agent.name, _id: agent._id }), // Asignar el usuario con el formato requerido
            "customFields.$[aiField].value": false,
          },
        },
        {
          arrayFilters: [
            { "classificationField.key": "classification" },
            { "statusField.key": "status" },
            { "userField.key": "user" },
            { "aiField.key": "ai" },
          ],
          new: true,
        }
      );

      return `😕 En esa ubicación no encontré una sucursal presencial, pero *no te preocupes*. Tenemos cursos *virtuales* y *online* igual de efectivos que puedes tomar desde cualquier parte.\n\n🎯 Con clases en vivo, sesiones con maestros certificados y acceso 24/7, ¡vas a avanzar rapidísimo! ¿Quieres que te dé los detalles para inscribirte?`;
    }
  } catch (error) {
    console.error("Error al obtener sucursales cercanas:", (error as any).message);
    return "No pude verificar las sucursales en este momento. ¿Puedes decirme tu ciudad o dirección?";
  }
};
