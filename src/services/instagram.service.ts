import axios from "axios";
import { Media } from "../models/Media";
import { User } from "../models";
import getToken from "../util/getToken";

interface RequestParams {
    igAccountId: string; 
    token: string;
}

const IGUserAttributes = [
    "biography", "id", "ig_id", "followers_count", "follows_count", "media_count", "name", "profile_picture_url", "username", "website",
];
const MediaAttributes = [
    "caption", "children", "comments", "like_count", "permalink", "media_url", "media_type", "username", "owner"
];
const CommentAttributes = [
    "media", "text", "like_count", "timestamp", "user", "username", "replies", "id"
];
export const getMediaIds = async ({ igAccountId, token }: RequestParams) => {
    const { data: { data: mediaIds } } = await axios.get(`/${igAccountId}/media`, {
        headers: {
            Authorization: "Bearer " + token
        }
    });
    return mediaIds;
};

export const loadAllMedia = async ({ igAccountId, token }: RequestParams) => {
    try {
        const mediaIds = await getMediaIds({ igAccountId, token });
        const medias: Media[] = [];
        for(const media of mediaIds) {
            const result = await loadMediaById({ mediaId: media.id, token});
            medias.push(result);
        }
        return medias;
    } catch (e) {
        console.log(e);
    }
};

export const loadMediaById = async ({ mediaId, token }: { mediaId: string; token: string }) => {
    try {
        console.log({ token });
        const { data } = await axios.get(`/${mediaId}`, {
            params: {
                fields: MediaAttributes.join(","),
            },
            headers: {
                Authorization: "Bearer " + token
            }
        });
        console.log(data);
        return data;
    } catch (e) {
        console.log("loadMediaById");
        console.log(e);
    }
};

export const loadComment = async (commentId: string, token: string) => {
    try {
        const { data } = await axios.get(`/${commentId}`, {
            params: {
                fields: CommentAttributes.join(","),
            },
            headers: {
                Authorization: "Bearer " + token
            }
        });
        console.log(data);
        return data;
    } catch (e) {
        console.log("loadComment");
        console.log(e);
    }
};

export const loadComments = async (mediaId: string, token: string) => {
    try {
        const { data } = await axios.get(`/${mediaId}/comments`, {
            headers: {
                Authorization: "Bearer " + token
            }
        });
        console.log(data);
        return data;
    } catch (e) {
        console.log("loadComment");
        console.log(e);
    }
};

export const loadIGUser = async ({ igAccountId, token }: RequestParams) => {
    try {
        const { data } = await axios.get(`/${igAccountId}`, {
            params: {
                fields: IGUserAttributes.join(","),
            },
            headers: {
                Authorization: "Bearer " + token
            }
        });
        return data;
    } catch (e) {
        console.log(e);
    }
};

interface CommentForMedia {
    mediaId: string;
    token: string;
    message: string;
}
export const createCommentForMedia = async ({ mediaId, token, message }: CommentForMedia) => {
    try {
        console.log({ mediaId, token, message });
        const { data } = await axios({
            method: "post",
            url: `/${mediaId}/comments`,
            params: {
                message,
                // access_token: token,
            },
            headers: {
                Authorization: "Bearer " + token
            }
        });
        return data;
    } catch(e) {
        console.log(e.message);
        return e.message;
    }
};

interface ResponseForMention {
    media_id?: string;
    token: string;
    message: string;
    userId: string;
    commentId?: string;
}
export const replyForMention = async ({ userId, commentId, media_id, token, message }: ResponseForMention) => {
    try {
        const { data } = await axios({
            method: "post",
            url: `/${userId}/mentions`,
            params: {
                media_id,
                commentId,
                message,
            },
            headers: {
                Authorization: "Bearer " + token
            }
        });
        return data;
    } catch(e) {
        console.log("replyForMention");
        console.log(e);
        return e.message;
    }
};

interface ReplyComment {
    commentId: string;
    token: string;
    message: string;
}

interface ReplyForComment {
    commentId: string;
    token: string;
    message: string;
}
export const replyForComment = async ({commentId, token, message}: ReplyForComment) => {
    try {
        const { data } = await axios({
            method: "post",
            url: `/${commentId}/replies`,
            params: {
                message,
                access_token: token,
            },
            headers: {
                Authorization: "Bearer " + token
            }
        });
        return data;
    } catch(e) {
        console.log("replyForComment");
        console.log(e);
        return e.message;
    } 
};

interface MentionedMedia {
    userId: string;
    media_id: string;
    token: string;
}
export const loadMentionedMedia = async ({ userId, media_id, token }: MentionedMedia) => {
    try {
        const { data } = await axios({
            method: "get",
            url: `/${userId}`,
            params: {
                fields: `mentioned_media.media_id(${media_id}){caption,media_type}`,
            },
            headers: {
                Authorization: "Bearer " + token
            }
        });
        return data;
    } catch(e) {
        console.log("replyForMention");
        console.log(e);
        return e.message;
    }
};
