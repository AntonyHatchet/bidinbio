import axios from 'axios';
import { IMedia } from '../models/Media';

interface IRequestParams {
    igAccountId: string, 
    token: string
}

const IGUserAttributes = [
    'biography', 'id', 'ig_id', 'followers_count', 'follows_count', 'media_count', 'name', 'profile_picture_url', 'username', 'website',
]
const MediaAttributes = [
    'caption', 'children', 'comments', 'like_count', 'permalink', 'media_url', 'media_type'
]
export const getMediaIds = async ({ igAccountId, token }: IRequestParams) => {
    const { data: { data: mediaIds } } = await axios.get(`/${igAccountId}/media`, {
        params: {
            access_token: token,
        }
    });
    return mediaIds;
}

export const getMedia = async ({ igAccountId, token }: IRequestParams) => {
    const mediaIds = await getMediaIds({ igAccountId, token });
    const medias: IMedia[] = [];
    for(const media of mediaIds) {
        const { data } = await axios.get(`/${media.id}`, {
            params: {
                access_token: token,
                fields: MediaAttributes.join(','),
            }
        });
        medias.push(data);
    }
    return medias;
}

export const getIGUser = async ({ igAccountId, token }: IRequestParams) => {
    const { data } = await axios.get(`/${igAccountId}`, {
        params: {
            access_token: token,
            fields: IGUserAttributes.join(','),
        }
    });
    console.log(data);
    return data;
}