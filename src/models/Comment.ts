import mongoose from "mongoose";
export type CommentDocument = mongoose.Document & {
    userId: String,
    mediaId: String,
    commentid: String,
    text: String,
    igUserId: String,
    username: String,
    replies: Array<any>,
    replyed: Boolean
};

const commentSchema = new mongoose.Schema({
    userId: String,
    mediaId: String,
    commentid: String,
    text: String,
    igUserId: String,
    username: String,
    replies: Array,
    replyed: Boolean
}, { timestamps: true });

export const Comment = mongoose.model<CommentDocument>("Comment", commentSchema);
