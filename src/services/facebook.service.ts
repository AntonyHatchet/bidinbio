import axios from "axios";
import { User } from '../models/User';

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
export const getBussinessAccount = async (facebookAccountId: string, token: string) => {
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
        const filter = { tokens: [ { kind:"facebook", accessToken: token }] };
        const user = await User.findOne(filter);
    
        if(user && !user.bussinessAccounts.facebook.includes(instagramBusinessAccount.id)){
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
        console.log(token)
        const { data } = await axios.get("/me", {
            params: {
                access_token: token,
                fields: FacebookUserAttributes.join(",")
            }
        });
        return data;
    } catch (e) {
        console.log('getFacebookUser')
        console.log(e.response && e.response.headers['www-authenticate'] || e.message)
    }
};

export const subscribeToPageWebhooks = async (pageId: string, token: string) => {
    try {
        console.log({ pageId, token })
        await axios({
            method: 'post',
            url: `/${pageId}/subscribed_apps`,
            params: {
                subscribed_fields: 'mention',
                access_token: token,
            }
        });
    } catch(e) {
        console.log('subscribeToPageWebhooks')
        console.log(e.response && e.response.headers['www-authenticate'] || e.message)
    }
}