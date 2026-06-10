import mongoose from "mongoose";

const { Schema, model } = mongoose;

const alarmSchema = new Schema(
  {
    // 알림을 받는 사람
    receiverRef: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // 알림을 발생시킨 사람 (댓글 작성자, 좋아요 클릭자 등)
    senderRef: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // 알림 타입: 'comment' (댓글), 'like_post' (게시글 좋아요), 'like_comment' (댓글 좋아요)
    type: {
      type: String,
      required: true,
      enum: ["comment", "like_post", "like_comment"],
    },
    // 연관된 게시글
    postRef: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    // 연관된 댓글 (댓글 좋아요 시 사용, 일반 게시글 알림 시 null)
    commentRef: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    // 읽음 여부
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "alarms",
  }
);

// 최신 순으로 정렬이 빈번할 것이므로 복합 인덱스 구성
alarmSchema.index({ receiverRef: 1, createdAt: -1 });

const Alarm = model("Alarm", alarmSchema);
export default Alarm;
