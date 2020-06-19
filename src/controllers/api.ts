"use strict";

import axios from "axios";
import { Response, Request, NextFunction } from "express";
import { AuthToken, UserDocument } from "../models/User";
import { getBussinessAccount, getFacebookUser } from "../services/facebook.service";
import { getIGUser, getMedia } from "../services/instagram.service";

axios.defaults.baseURL = "https://graph.facebook.com/v7.0";
/**
 * GET /api
 * List of API examples.
 */
export const getApi = (req: Request, res: Response) => {
    res.render("api/index", {
        title: "API Examples"
    });
};

/**
 * GET /api/facebook
 * Facebook API example.
 */
export const getFacebook = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as UserDocument;
    const token = user.tokens.find((token: AuthToken) => token.kind === "facebook");
    const me = await getFacebookUser(token.accessToken);
    const accounts = me.accounts || { data: []};
    const instagramBusinessAccounts = new Set<string>();

    for(const account of accounts.data) {
        const instagramBusinessAccount = await getBussinessAccount(account.id, token.accessToken);
        if(instagramBusinessAccount && instagramBusinessAccount.id){
            instagramBusinessAccounts.add(instagramBusinessAccount.id);
        }
    }

    interface MediaType {
        [key: string]: any;
    }
    const mediaByProfile: MediaType = {};
    for(const igaccount of instagramBusinessAccounts) {
        const medias = await getMedia({igAccountId: igaccount, token: token.accessToken});

        for(const media of medias) {
            if(!mediaByProfile[igaccount]){
                mediaByProfile[igaccount] = [];
            }
            mediaByProfile[igaccount].push(media);
        }
    }
    let IGUser = {};

    if(instagramBusinessAccounts.size > 0){
        IGUser = await getIGUser({igAccountId: instagramBusinessAccounts.values().next().value, token: token.accessToken});
    }

    res.render("api/facebook", {
        title: "Facebook API",
        profile: {...me, ...IGUser, mediaByProfile}
    });
};

export const instagramHook = (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as UserDocument;
    const token = user.tokens.find((token: any) => token.kind === "facebook");
};
