import axios from "axios";
import { Media } from "../models/Media";

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
export const getMediaIds = async ({ igAccountId, token }: RequestParams) => {
    const { data: { data: mediaIds } } = await axios.get(`/${igAccountId}/media`, {
        params: {
            access_token: token,
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

export const loadMediaById = async ({ mediaId, token }: { mediaId: string; token: string; }) => {
    try {
        const { data } = await axios.get(`/${mediaId}`, {
            params: {
                access_token: token,
                fields: MediaAttributes.join(","),
            }
        });
        return data;
    } catch (e) {
        console.log(e);
    }
};

export const loadMediaByCommentId = async ({ commentId, token }: {
    commentId: string; token: string;
}) => {

}

export const loadIGUser = async ({ igAccountId, token }: RequestParams) => {
    try {
        const { data } = await axios.get(`/${igAccountId}`, {
            params: {
                access_token: token,
                fields: IGUserAttributes.join(","),
            }
        });
        return data;
    } catch (e) {
        console.log(e);
    }
};

interface CommentForMedia {
    mediaId: string;
    token:string;
    message:string;
}
export const createCommentForMedia = async ({ mediaId, token, message }: CommentForMedia) => {
    try {
        console.log({ mediaId, token, message })
        const { data } = await axios({
            method: 'post',
            url: `/${mediaId}/comments`,
            params: {
                message,
                access_token: token,
            }
        });
        return data;
    } catch(e) {
        console.log(e.message)
        return e.message;
    }
}

interface SubscribeForWebhook {
    pageId: string;
    token:string;
    message:string;
}
