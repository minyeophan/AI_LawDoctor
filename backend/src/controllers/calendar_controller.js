import Schedule from "../schemas/calendar_db.js";
import User from "../schemas/user_db.js";
import { google } from "googleapis";
import axios from "axios";

const createOAuth2Client = (user) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: user.googleAccessToken || undefined,
    refresh_token: user.googleRefreshToken || undefined,
  });

  oauth2Client.on("tokens", async (tokens) => {
    try {
      if (tokens.refresh_token) user.googleRefreshToken = tokens.refresh_token;
      if (tokens.access_token) user.googleAccessToken = tokens.access_token;
      if (tokens.expiry_date) user.googleTokenExpiry = new Date(tokens.expiry_date);
      await user.save();
    } catch (error) {
      console.error("Google token update error:", error);
    }
  });

  return oauth2Client;
};

const buildGoogleEvent = (schedule) => {
  const title = schedule.title || schedule.scheduleName;
  return {
    summary: title,
    start: { dateTime: new Date(schedule.startDate).toISOString() },
    end: { dateTime: new Date(schedule.endDate).toISOString() },
    reminders: {
      useDefault: false,
      overrides: schedule.alarmEnabled
        ? [{ method: "email", minutes: Number(schedule.alarm || 1440) }]
        : [],
    },
  };
};

const formatKakaoDate = (dateObjectOrString) => {
  const d =
    typeof dateObjectOrString === "string"
      ? new Date(dateObjectOrString)
      : dateObjectOrString;
  return d.toISOString().substring(0, 19) + "Z";
};

const roundToFiveMinutes = (dateInput, ceil = true) => {
  const d =
    typeof dateInput === "string" ? new Date(dateInput) : new Date(dateInput);
  d.setSeconds(0, 0);
  const mins = d.getMinutes();
  const rem = mins % 5;
  if (rem !== 0) {
    if (ceil) d.setMinutes(mins + (5 - rem));
    else d.setMinutes(mins - rem);
  }
  return d;
};

const buildKakaoEventObject = (title, roundedStart, roundedEnd, resolvedAlarm, resolvedAlarmEnabled) => {
  const eventObject = {
    title,
    time: {
      start_at: formatKakaoDate(roundedStart),
      end_at: formatKakaoDate(roundedEnd),
      time_zone: "Asia/Seoul",
    },
    description: "기한 임박 일정 알림 서비스",
    color: "BLUE",
  };

  if (resolvedAlarmEnabled) {
    eventObject.reminders = [String(resolvedAlarm)];
  }

  return eventObject;
};

const resolveKakaoTimes = (startDate, endDate) => {
  const originalStart =
    typeof startDate === "string" ? new Date(startDate) : new Date(startDate);
  const originalEnd =
    typeof endDate === "string" ? new Date(endDate) : new Date(endDate);
  const roundedStart = roundToFiveMinutes(originalStart, true);
  const roundedEnd = roundToFiveMinutes(originalEnd, true);

  if (roundedEnd.getTime() <= roundedStart.getTime()) {
    roundedEnd.setTime(roundedStart.getTime() + 30 * 60 * 1000);
  }

  return { roundedStart, roundedEnd };
};

const createKakaoEvent = async (user, scheduleData) => {
  try {
    const title = scheduleData.title || scheduleData.scheduleName;
    const resolvedAlarm = Number(scheduleData.alarm ?? 1440);
    const resolvedAlarmEnabled = scheduleData.alarmEnabled !== false;

    const { roundedStart, roundedEnd } = resolveKakaoTimes(
      scheduleData.startDate,
      scheduleData.endDate
    );

    const eventObject = buildKakaoEventObject(
      title,
      roundedStart,
      roundedEnd,
      resolvedAlarm,
      resolvedAlarmEnabled
    );

    const response = await axios.post(
      "https://kapi.kakao.com/v2/api/calendar/create/event",
      {
        calendar_id: "primary",
        event: JSON.stringify(eventObject),
      },
      {
        headers: {
          Authorization: `Bearer ${user.kakaoAccessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data.event_id;
  } catch (error) {
    console.error(
      "카카오 캘린더 이벤트 생성 실패:",
      error.response?.data || error.message
    );
    return null;
  }
};

const updateKakaoEvent = async (user, kakaoEventId, scheduleData) => {
  try {
    const title = scheduleData.title || scheduleData.scheduleName;
    const resolvedAlarm = Number(scheduleData.alarm ?? 1440);
    const resolvedAlarmEnabled = scheduleData.alarmEnabled !== false;

    const { roundedStart, roundedEnd } = resolveKakaoTimes(
      scheduleData.startDate,
      scheduleData.endDate
    );

    const eventObject = buildKakaoEventObject(
      title,
      roundedStart,
      roundedEnd,
      resolvedAlarm,
      resolvedAlarmEnabled
    );

    await axios.post(
      "https://kapi.kakao.com/v2/api/calendar/update/event",
      {
        calendar_id: "primary",
        event_id: kakaoEventId,
        event: JSON.stringify(eventObject),
      },
      {
        headers: {
          Authorization: `Bearer ${user.kakaoAccessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
  } catch (error) {
    console.error(
      "카카오 캘린더 이벤트 수정 실패:",
      error.response?.data || error.message
    );
  }
};

const deleteKakaoEvent = async (user, kakaoEventId) => {
  try {
    await axios.post(
      "https://kapi.kakao.com/v2/api/calendar/delete/event",
      {
        calendar_id: "primary",
        event_id: kakaoEventId,
      },
      {
        headers: {
          Authorization: `Bearer ${user.kakaoAccessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
  } catch (error) {
    console.error(
      "카카오 캘린더 이벤트 삭제 실패:",
      error.response?.data || error.message
    );
  }
};

const clearGoogleTokens = async (user) => {
  try {
    user.googleAccessToken = null;
    user.googleRefreshToken = null;
    await user.save();
  } catch (saveErr) {
    console.error("사용자 토큰 제거 중 에러:", saveErr);
  }
};

export const getSchedule = async (req, res, next) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "로그인이 필요합니다." });

    const currentUserId = req.user.userID;
    const schedules = await Schedule.find({ userId: currentUserId })
      .sort({ startDate: 1 })
      .lean();

    const formattedSchedules = schedules.map((schedule) => ({
      ...schedule,
      scheduleName: schedule.title,
    }));

    return res.status(200).json({
      success: true,
      total: schedules.length,
      list: formattedSchedules,
    });
  } catch (error) {
    console.error("일정 목록 조회 에러: ", error);
    next(error);
  }
};

export const createSchedule = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "로그인이 필요합니다." });

    const { scheduleName, startDate, endDate, alarm, alarmEnabled } = req.body;
    const currentUserId = req.user.userID;
    const user = await User.findById(req.user._id);

    const start = new Date(startDate);
    let end = new Date(endDate);

    const resolvedAlarm = alarm ?? 1440;
    const resolvedAlarmEnabled = alarmEnabled !== false;

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res
        .status(400)
        .json({ success: false, message: "유효하지 않은 날짜 형식입니다." });
    }

    if (start.getTime() >= end.getTime()) {
      end = new Date(start.getTime() + 30 * 60 * 1000);
    }

    let googleEventId = null;
    let kakaoEventId = null;

    if (user && user.googleAccessToken) {
      try {
        const oauth2Client = createOAuth2Client(user);
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        const event = buildGoogleEvent({
          title: scheduleName,
          startDate: start,
          endDate: end,
          alarm: resolvedAlarm,
          alarmEnabled: resolvedAlarmEnabled,
        });
        const response = await calendar.events.insert({
          calendarId: "primary",
          resource: event,
        });
        googleEventId = response.data.id;
      } catch (err) {
        console.error("Google 캘린더 생성 중 에러 발생 (건너뜀):", err.message);
        const msg = err.response?.data?.error?.message || err.message || "";
        if (msg.includes("Insufficient Permission") || err.code === 403) {
          await clearGoogleTokens(user);
        }
      }
    }

    if (user && user.kakaoAccessToken) {
      kakaoEventId = await createKakaoEvent(user, {
        scheduleName,
        startDate: startDate || start,
        endDate: endDate || end,
        alarm: resolvedAlarm,
        alarmEnabled: resolvedAlarmEnabled,
      });
    }

    const newSchedule = new Schedule({
      title: scheduleName,
      startDate: start,
      endDate: end,
      alarm: resolvedAlarm,
      alarmEnabled: resolvedAlarmEnabled,
      googleEventId,
      kakaoEventId,
      userId: currentUserId,
    });

    await newSchedule.save();

    return res.status(201).json({
      success: true,
      message: "일정이 생성되고 카카오 캘린더에 등록되었습니다.",
      data: newSchedule,
    });
  } catch (error) {
    console.error("일정 생성 에러: ", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "로그인이 필요합니다." });

    const { id } = req.params;
    const currentUserId = req.user.userID;
    const { scheduleName, startDate, endDate, alarm, alarmEnabled } = req.body;

    const schedule = await Schedule.findOne({ _id: id, userId: currentUserId });
    if (!schedule)
      return res
        .status(404)
        .json({ success: false, message: "일정을 찾을 수 없습니다." });

    if (startDate) schedule.startDate = new Date(startDate);
    if (endDate) schedule.endDate = new Date(endDate);

    if (schedule.startDate.getTime() >= schedule.endDate.getTime()) {
      schedule.endDate = new Date(schedule.startDate.getTime() + 30 * 60 * 1000);
    }

    schedule.title = scheduleName ?? schedule.title;
    schedule.alarm = alarm ?? schedule.alarm;
    schedule.alarmEnabled =
      alarmEnabled !== undefined ? alarmEnabled : schedule.alarmEnabled;

    const user = await User.findById(req.user._id);

    if (schedule.googleEventId && user && user.googleAccessToken) {
      try {
        const oauth2Client = createOAuth2Client(user);
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        await calendar.events.update({
          calendarId: "primary",
          eventId: schedule.googleEventId,
          resource: buildGoogleEvent(schedule),
        });
      } catch (err) {
        console.error("Google 캘린더 수정 실패:", err.message);
        const msg = err.response?.data?.error?.message || err.message || "";
        if (msg.includes("Insufficient Permission") || err.code === 403) {
          await clearGoogleTokens(user);
        }
      }
    }

    if (schedule.kakaoEventId && user && user.kakaoAccessToken) {
      await updateKakaoEvent(user, schedule.kakaoEventId, schedule);
    }

    await schedule.save();
    return res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    console.error("일정 수정 에러: ", error);
    return res.status(500).json({ success: false, message: "수정 실패" });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "로그인이 필요합니다." });

    const { id } = req.params;
    const currentUserId = req.user.userID;
    const schedule = await Schedule.findOne({ _id: id, userId: currentUserId });

    if (!schedule)
      return res
        .status(404)
        .json({ success: false, message: "일정을 찾을 수 없습니다." });

    const user = await User.findById(req.user._id);

    if (schedule.googleEventId && user && user.googleAccessToken) {
      try {
        const oauth2Client = createOAuth2Client(user);
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        await calendar.events.delete({
          calendarId: "primary",
          eventId: schedule.googleEventId,
        });
      } catch (error) {
        console.error("Google 이벤트 삭제 실패:", error.message);
      }
    }

    if (schedule.kakaoEventId && user && user.kakaoAccessToken) {
      await deleteKakaoEvent(user, schedule.kakaoEventId);
    }

    await schedule.deleteOne();
    return res.status(200).json({ success: true, message: "삭제 완료" });
  } catch (error) {
    console.error("일정 삭제 에러: ", error);
    return res.status(500).json({ success: false, message: "삭제 실패" });
  }
};

export const sendScheduleNotifications = async () => {
  try {
    const now = new Date();
    console.log(
      `[${now.toLocaleString()}] [NODE-CRON] 계약 관리 일정 알림 동기화 체크 중...`
    );
  } catch (error) {
    console.error("[NODE-CRON ERROR] 알림 스케줄러 실행 중 에러:", error);
  }
};