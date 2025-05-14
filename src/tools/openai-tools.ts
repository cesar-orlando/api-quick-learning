import axios from "axios";
import { User } from "../models/user.model"; // Modelo para los usuarios
import { DynamicRecord } from "../models/record.model";
import geolib from "geolib"; // Biblioteca para calcular distancias
import { getDistance } from "geolib";


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
        {
          key: "user",
          label: "Asesor Asignado",
          value: JSON.stringify({ name: agent.name, _id: agent._id }),
          type: "text",
        }, // Asignar el usuario con el formato requerido
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
    // Obtener las sedes activas desde la tabla "sedes"
    const branches = await DynamicRecord.find({
      tableSlug: "sedes",
      customFields: { $elemMatch: { key: "status", value: "activo" } },
    });

    if (!branches || branches.length === 0) {
      throw new Error("No se encontraron sedes activas.");
    }

    const normalizedCity = city.trim().toLowerCase();

    const getField = (fields: any[], key: string) =>
      fields.find((f) => f.key.toLowerCase().trim() === key.toLowerCase().trim());

    const foundBranch = branches.find((branch: any) => {
      const address = getField(branch.customFields, "direccion");
      return address && address.value.toLowerCase().includes(normalizedCity);
    });

    if (foundBranch) {
      const name = getField(foundBranch.customFields, "nombre")?.value || "Sucursal sin nombre";
      const address = getField(foundBranch.customFields, "direccion")?.value || "Dirección no disponible";
      const mapLink = getField(foundBranch.customFields, "googlelink")?.value || "Sin enlace de ubicación";

      return `📍 ¡Excelente! Tenemos una sucursal en tu ciudad:\n\n🏫 *${name}*\n📍 Dirección: ${address}\n🌐 Google Maps: ${mapLink}\n\nContamos con tres modalidades:\n1. Presencial\n2. Virtual (videollamada en vivo)\n3. Online (plataforma autogestionada)\n\n¿Cuál prefieres?`;
    } else {
      // No se encontró sucursal, se responde con opciones virtuales
      const users = await User.find();
      if (!users.length) throw new Error("No hay usuarios disponibles para asignar.");

      const randomUser = users[Math.floor(Math.random() * users.length)];

      await DynamicRecord.findOneAndUpdate(
        {
          tableSlug: "prospectos",
          customFields: { $elemMatch: { key: "phone", value: WaId } },
        },
        {
          $set: {
            "customFields.$[classificationField].value": "Prospecto",
            "customFields.$[statusField].value": "Interesado",
            "customFields.$[userField].value": JSON.stringify({
              name: randomUser.name,
              _id: randomUser._id,
            }),
            "customFields.$[aiField].value": true,
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

      return `🤖 ¡Qué padre, ${city} es un lugar hermoso! Actualmente no tenemos una sucursal presencial ahí, pero no te preocupes...\n\n🎯 Tenemos dos opciones para ti:\n1. **Virtual** – Clases en vivo por videollamada.\n2. **Online** – Plataforma que puedes usar a tu ritmo.\n\n¿Te gustaría que te cuente más?`;
    }
  } catch (error) {
    console.error("Error al obtener sedes:", (error as any).message);
    return "No pude verificar las sedes en este momento. ¿Me puedes decir tu ciudad para ayudarte?";
  }
};

const geocodeAddress = async (address: string) => {
  try {
    // 🔹 1. Primero intentar con PositionStack
    const response = await axios.get("http://api.positionstack.com/v1/forward", {
      params: {
        access_key: process.env.POSITIONSTACK_API_KEY,
        query: address,
        limit: 1,
        country: "MX",
      },
    });

    if (response.data?.data?.length > 0) {
      return {
        lat: response.data.data[0].latitude,
        lng: response.data.data[0].longitude,
        source: "positionstack",
      };
    }

    throw new Error("PositionStack no encontró resultados");
  } catch (error1) {
    console.warn("⚠️ PositionStack falló. Probando con OpenCage...");

    try {
      // 🔸 2. Fallback a OpenCage
      const fallback = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
        params: {
          key: process.env.OPENCAGE_API_KEY,
          q: address,
          countrycode: "mx",
          limit: 1,
        },
      });

      if (fallback.data?.results?.length > 0) {
        return {
          lat: fallback.data.results[0].geometry.lat,
          lng: fallback.data.results[0].geometry.lng,
          source: "opencage",
        };
      }

      // console.log("fallback.data", fallback.data);

      throw new Error("OpenCage tampoco encontró resultados");
    } catch (error2) {
      console.warn("⚠️ OpenCage falló. Probando con Nominatim...");

      try {
        // 🔹 3. Fallback final a Nominatim OpenStreetMap
        const nominatim = await axios.get("https://nominatim.openstreetmap.org/search", {
          params: {
            q: address,
            format: "json",
            addressdetails: 1,
            limit: 1,
            countrycodes: "mx",
          },
          headers: {
            "User-Agent": "VirtualVoices/1.0 (yourvirtualvoices@gmail.com)",
          },
        });

        if (nominatim.data?.length > 0) {
          return {
            lat: nominatim.data[0].lat,
            lng: nominatim.data[0].lon,
            source: "nominatim",
          };
        }

        // console.log("nominatim.data", nominatim);

        throw new Error("Nominatim tampoco encontró resultados");
      } catch (error3) {
        // console.error("❌ Todos los servicios de geocodificación fallaron:", (error3 as any).message);
        throw new Error("No se pudo geocodificar la dirección con ningún servicio.");
      }
    }
  }
};


export const suggest_nearby_branch = async (params: any, WaId: string): Promise<string> => {
  try {
    const branches = await DynamicRecord.find({
      tableSlug: "sedes",
      customFields: { $elemMatch: { key: "status", value: "activo" } },
    });

    if (!branches.length) throw new Error("No se encontraron sedes activas.");

    let userCoords;

    if (params.lat && params.lng) {
      userCoords = {
        latitude: parseFloat(params.lat),
        longitude: parseFloat(params.lng),
      };
    } else if (params.address) {
      const geo = await geocodeAddress(params.address);
      userCoords = {
        latitude: geo.lat,
        longitude: geo.lng,
      };
    } else {
      return "Necesito una dirección o ubicación para poder ayudarte.";
    }

    const getField = (fields: any[], key: string) =>
      fields.find((f) => f.key.toLowerCase().trim() === key.toLowerCase().trim());

    const branchesWithDistance = await Promise.all(
      branches.map(async (branch: any) => {
        const address = getField(branch.customFields, "direccion")?.value;
        const name = getField(branch.customFields, "nombre")?.value;
        const mapLink = getField(branch.customFields, "googlelink")?.value;

        if (!address || !name) return null;

        try {
          const geo = await geocodeAddress(address);
          const coords = {
            latitude: geo.lat,
            longitude: geo.lng,
          };

          return {
            name,
            address,
            mapLink,
            distance: getDistance(userCoords, coords),
          };
        } catch (err) {
          return null;
        }
      })
    );

    const validBranches = branchesWithDistance.filter(Boolean).sort((a: any, b: any) => a.distance - b.distance);

    if (validBranches.length > 0) {
      const lista = validBranches
        .slice(0, 3)
        .map((s: any, i: number) => `*${i + 1}.* ${s.name}\n📍 ${s.address}\n🌐 ${s.mapLink || "Sin enlace"}`)
        .join("\n\n");

      return `Estas son las sucursales más cercanas a ti:\n\n${lista}\n\n¿Te late alguna?`;
    } else {
      const users = await User.find();
      if (!users.length) throw new Error("No hay usuarios disponibles para asignar.");

      const randomUser = users[Math.floor(Math.random() * users.length)];

      await DynamicRecord.findOneAndUpdate(
        {
          tableSlug: "prospectos",
          customFields: { $elemMatch: { key: "phone", value: WaId } },
        },
        {
          $set: {
            "customFields.$[classificationField].value": "Prospecto",
            "customFields.$[statusField].value": "Interesado",
            "customFields.$[userField].value": JSON.stringify({
              name: randomUser.name,
              _id: randomUser._id,
            }),
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

