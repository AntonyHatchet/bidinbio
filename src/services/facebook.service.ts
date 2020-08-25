import axios from "axios";
import { User } from "../models/User";
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
const requestedPermissions = [
    'public_profile',
    'pages_manage_metadata',
    'pages_read_engagement',
    'instagram_manage_comments',
    'instagram_basic',
    'pages_show_list',
    'email',
]

export const getBusinessAccount = async ({ facebookAccountId, token, userId }: {facebookAccountId: string; token: string; userId: string}) => {
    if(!facebookAccountId) {
        throw Error("facebookAccountId not found");
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

        if(user && instagramBusinessAccount && (!user.businessAccounts || user.businessAccounts.facebook.every(acc => acc.id !== instagramBusinessAccount.id))){
            user.businessAccounts.facebook = user.businessAccounts.facebook || [];
            user.businessAccounts.facebook.push({
                id: instagramBusinessAccount.id,
                pageId,
                subscribed: false
            });
            await user.save();
        }
    
        return { instagramBusinessAccount, pageId };
    } catch (e) {
        console.log("getBusinessAccount");        
        console.log(JSON.stringify(e));
        console.log(e.response && e.response.headers["www-authenticate"] || e.message);
        return {};
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
        console.log("getFacebookUser");
        console.log(JSON.stringify(e));
        console.log(e.response && e.response.headers["www-authenticate"] || e.message);
    }
};

export const getLongTermUserKey = async (token: string) => {
    try {
        const { data: { access_token } } = await axios.get("/oauth/access_token", {
            params: {
                grant_type: "fb_exchange_token",
                client_id: FACEBOOK_ID,
                client_secret: FACEBOOK_SECRET,
                fb_exchange_token: token,
            }
        });
        return access_token;
    } catch (e) {
        console.log("getLongTermUserKey");
        console.log(JSON.stringify(e));
        console.log(e.response && e.response.headers["www-authenticate"] || e.message);
        return {};
    }
};

export const getPageToken = async (pageId: string, token: string) => {
    try {
        const { data: { access_token } } = await axios.get(`${pageId}`, {
            params: {
                fields: "access_token",
            },
            headers: {
                Authorization: "Bearer " + token
            }
        });
        return access_token;
    } catch (e) {
        console.log("getPageToken");
        console.log(JSON.stringify(e));
        console.log(e.response && e.response.headers["www-authenticate"] || e.message);
        return {};
    }
};
export const subscribeToPageWebhooks = async (pageId: string, token: string) => {
    try {
        await axios({
            method: "post",
            url: `/${pageId}/subscribed_apps`,
            params: {
                subscribed_fields: "mention",
            },
            headers: {
                Authorization: "Bearer " + token
            }
        });
    } catch(e) {
        console.log("subscribeToPageWebhooks");
        console.log(JSON.stringify(e));
    }
};

export const getAPIPermissions = async (accountId: string, token: string) => {
    try {
        const { data } = await axios({
            method: "get",
            url: `/${accountId}/permissions`,
            headers: {
                Authorization: "Bearer " + token
            }
        });
        return data;
    } catch(e) {
        console.log("getAPIPermissions");
        console.log(JSON.stringify(e));
    }
};

export const checkPermission = (permissions: any) => {
    const grantedPermissions = permissions.map(({ permission, status }) => status === 'granted' && permission);
    return requestedPermissions.every(rqp => grantedPermissions.includes(rqp));
}