import Alarm from "../schemas/alarm_db.js";
import mongoose from "mongoose";

const { Types } = mongoose;

export const createAlarmHelper = async ({ receiverRef, senderRef, type, postRef, commentRef = null }) => {
    try {
        if (receiverRef.toString() === senderRef.toString()) {
            return null;
        }

        const alarm = await Alarm.create({
            receiverRef,
            senderRef,
            type,
            postRef,
            commentRef: commentRef || null,
        });
        return alarm;
    } catch (error) {
        console.error("createAlarmHelper error:", error);
        throw error;
    }
};

export const getAlarms = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "로그인이 필요합니다." });
        }

        const alarms = await Alarm.find({ receiverRef: req.user._id })
            .populate("senderRef", "name userID avatar")
            .populate("postRef", "title")
            .sort({ createdAt: -1 });

        const response = alarms.map((alarm) => ({
            id: alarm._id.toString(),
            type: alarm.type,
            sender: {
                id: alarm.senderRef?._id?.toString() || null,
                name: alarm.senderRef?.name || "익명",
                userID: alarm.senderRef?.userID || null,
                avatar: alarm.senderRef?.avatar || "",
            },
            post: {
                id: alarm.postRef?._id?.toString() || null,
                title: alarm.postRef?.title || "삭제된 게시글",
            },
            commentId: alarm.commentRef ? alarm.commentRef.toString() : null,
            isRead: alarm.isRead,
            createdAt: alarm.createdAt,
        }));

        return res.status(200).json(response);
    } catch (error) {
        console.error("getAlarms error:", error);
        next(error);
    }
};

export const readAlarm = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!req.user) {
            return res.status(401).json({ message: "로그인이 필요합니다." });
        }

        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "유효하지 않은 알림 ID입니다." });
        }

        const alarm = await Alarm.findOneAndUpdate(
            { _id: id, receiverRef: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!alarm) {
            return res.status(404).json({ message: "알림을 찾을 수 없거나 접근 권한이 없습니다." });
        }

        return res.status(200).json({ message: "알림 읽음 처리 완료", alarmId: alarm._id });
    } catch (error) {
        console.error("readAlarm error:", error);
        next(error);
    }
};

export const readAllAlarms = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "로그인이 필요합니다." });
        }

        await Alarm.updateMany(
            { receiverRef: req.user._id, isRead: false },
            { isRead: true }
        );

        return res.status(200).json({ message: "모든 알림 읽음 처리 완료" });
    } catch (error) {
        console.error("readAllAlarms error:", error);
        next(error);
    }
};

export const deleteAlarm = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!req.user) {
            return res.status(401).json({ message: "로그인이 필요합니다." });
        }

        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "유효하지 않은 알림 ID입니다." });
        }

        const alarm = await Alarm.findOneAndDelete({ _id: id, receiverRef: req.user._id });

        if (!alarm) {
            return res.status(404).json({ message: "알림을 찾을 수 없거나 접근 권한이 없습니다." });
        }

        return res.status(200).json({ message: "알림 삭제 완료" });
    } catch (error) {
        console.error("deleteAlarm error:", error);
        next(error);
    }
};
