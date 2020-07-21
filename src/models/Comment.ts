import mongoose from "mongoose";
export type CommentDocument = mongoose.Document & {
    userId: string;
    mediaId: string;
    commentId: string;
    text: string;
    igUserId: string;
    username: string;
    replies: Array<any>;
    replyed: boolean;
};

const commentSchema = new mongoose.Schema({
    userId: String,
    mediaId: String,
    commentId: String,
    text: String,
    igUserId: String,
    username: String,
    replies: Array,
    replyed: Boolean
}, { timestamps: true });

export const Comment = mongoose.model<CommentDocument>("Comment", commentSchema);
