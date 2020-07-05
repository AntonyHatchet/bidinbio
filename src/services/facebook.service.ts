import axios from "axios";
import { User } from '../models/User';
import { FACEBOOK_ID, FACEBOOK_SECRET } from "../util/secrets";

const FacebookUserAttributes = [
    "id",
    "name",
    "email",
    "first_name",
    "last_name",
    "gender",
    "link",
    "accounts"
];
export const getBussinessAccount = async ({ facebookAccountId, token, userId }: {facebookAccountId: string, token: string, userId: string}) => {
    if(!facebookAccountId) {
        throw Error('facebookAccountId not found')
    }
    try{
        const { data: { 
            instagram_business_account: instagramBusinessAccount,
            id: pageId 
        }} = await axios.get(`/${facebookAccountId}`, {
            params: {
                access_token: token,
                fields: "instagram_business_account"
            }
        });
        const user = await User.findOne({ _id: userId });

        console.log({ user, facebookAccountId, instagramBusinessAccount });

        if(user && (!user.bussinessAccounts || !user.bussinessAccounts.facebook.includes(instagramBusinessAccount.id))){
            user.bussinessAccounts.facebook = user.bussinessAccounts.facebook || [];
            user.bussinessAccounts.facebook.push(instagramBusinessAccount.id);
            await user.save();
        }
    
        return { instagramBusinessAccount, pageId };
    } catch (e) {
        console.log('getBussinessAccount')
        console.log(e.response && e.response.headers['www-authenticate'] || e.message)
        return {}
    }
};

export const getFacebookUser = async (token: string) => {
    try{
        const { data } = await axios.get("/me", {
            params: {
                access_token: token,
                fields: FacebookUserAttributes.join(",")
            },
        });
        return data;
    } catch (e) {
        console.log('getFacebookUser')
        console.log(e.response && e.response.headers['www-authenticate'] || e.message)
    }
};

export const getLongTermUserKey = async (token: string) => {
    try {
        const { data: { access_token } } = await axios.get("/oauth/access_token", {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: FACEBOOK_ID,
                client_secret: FACEBOOK_SECRET,
                fb_exchange_token: token,
            }
        });
        return access_token;
    } catch (e) {
        console.log('getLongTermUserKey')
        console.log(e.response && e.response.headers['www-authenticate'] || e.message)
        return {}
    }
}

export const getPageToken = async (pageId: string, token: string) => {
    try {
        const { data: { access_token } } = await axios.get(`${pageId}`, {
            params: {
                fields: 'access_token',
            },
            headers: {
                Authorization: 'Bearer ' + token
            }
        });
        return access_token;
    } catch (e) {
        console.log('getPageToken')
        console.log(e.response && e.response.headers['www-authenticate'] || e.message)
        return {}
    }
}
export const subscribeToPageWebhooks = async (pageId: string, token: string) => {
    try {
        await axios({
            method: 'post',
            url: `/${pageId}/subscribed_apps`,
            params: {
                subscribed_fields: 'mention',
            },
            headers: {
                Authorization: 'Bearer ' + token
            }
        });
    } catch(e) {
        console.log('subscribeToPageWebhooks')
        console.log(e.response && e.response.headers['www-authenticate'] || e.message)
    }
}