import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const agentId = "agent_01jw2vkb3pf9w8jx85daq02mae"; // tu ID
const apiKey = process.env.ELEVENLABS_API_KEY_VV;

const getAgentInfo = async () => {
  try {
    const { data } = await axios.get(
      `https://api.elevenlabs.io/v1/convai/agents/agent_01jw2vkb3pf9w8jx85daq02mae`,
      {
        headers: {
          "xi-api-key": apiKey,
        },
      }
    );

    console.log("🎯 Configuración del agent:");
    console.log(JSON.stringify(data, null, 2));
  } catch (error: any) {
    console.error("❌ Error al obtener el agent:", error?.response?.data || error.message);
  }
};

getAgentInfo();