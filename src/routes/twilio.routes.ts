import { Router } from "express";
import { handleVoiceCall} from "../controllers/twilio.controller";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    code: 200,
    message: "Sistema operativo: Milkasa Node Engine v2.4",
    uptime: `${Math.floor(process.uptime())}s`,
    trace: "XJ-85::Verified",
  });
});

router.post("/incoming-call", handleVoiceCall);


export default router;
