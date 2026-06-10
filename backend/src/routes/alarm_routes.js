import express from "express";
import authMiddleware from "../middleware/auth_middle.js";
import {
    getAlarms,
    readAlarm,
    readAllAlarms,
    deleteAlarm,
} from "../controllers/alarm_controller.js";

const router = express.Router();

// 알림 기능은 모두 회원 전용 기능
router.use(authMiddleware);

router.get("/alarms", getAlarms);
router.patch("/alarms/read-all", readAllAlarms);
router.patch("/alarms/:id/read", readAlarm);
router.delete("/alarms/:id", deleteAlarm);

export default router;
