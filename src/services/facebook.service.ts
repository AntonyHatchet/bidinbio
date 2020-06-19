import axios from "axios";

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
    const { data: { instagram_business_account: iba } } = await axios.get(`/${facebookAccountId}`, {
        params: {
            access_token: token,
            fields: "instagram_business_account"
        }
    });
    return iba;
};

export const getFacebookUser = async (token: string) => {
    const { data } = await axios.get("/me", {
        params: {
            access_token: token,
            fields: FacebookUserAttributes.join(",")
        }
    });

    return data;
};