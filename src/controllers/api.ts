"use strict";

import axios from "axios";
import { Response, Request, NextFunction } from "express";
import { AuthToken, User, UserDocument } from "../models/User";
import { 
    getBussinessAccount,
    getFacebookUser,
    getLongTermUserKey,
    getPageToken,
    subscribeToPageWebhooks,
} from "../services/facebook.service";
import { createCommentForMedia, loadIGUser, loadAllMedia } from "../services/instagram.service";

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
export const setupAccount = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as UserDocument;
    const token = user.tokens.find((token: AuthToken) => token.kind === "facebook");
    const me = await getFacebookUser(token.accessToken);
    const accounts = me.accounts || { data: []};
    const instagramBusinessAccountIds = new Set<string>();
    const longTermToken = await getLongTermUserKey(token.accessToken);
    
    for(const account of accounts.data) {
        const { instagramBusinessAccount, pageId } = await getBussinessAccount({ 
            facebookAccountId: account.id, 
            token: token.accessToken,
            userId: user._id,
        });
        const pageToken = await getPageToken(pageId, longTermToken);

        if(pageId){
            await subscribeToPageWebhooks(pageId, pageToken);
        }

        if(instagramBusinessAccount && instagramBusinessAccount.id) {
            instagramBusinessAccountIds.add(instagramBusinessAccount.id);
        }
    }

    const IGUsers = [];
    for(const igAccountId of instagramBusinessAccountIds) {
        const account = await loadIGUser({igAccountId, token: token.accessToken})
        IGUsers.push(account)
    }

    interface MediaType {
        [key: string]: any;
    }
    const mediaByProfile: MediaType = {};
    for(const igaccount of instagramBusinessAccountIds) {
        const medias = await loadAllMedia({igAccountId: igaccount, token: token.accessToken});

        for(const media of medias) {
            if(!mediaByProfile[igaccount]){
                mediaByProfile[igaccount] = [];
            }
            mediaByProfile[igaccount].push(media);
        }
    }
    
    res.render("api/facebook", {
        title: "Facebook API",
        profile: {...me, IGUsers}
    });
};

export const instagramHook = (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as UserDocument;
    const token = user.tokens.find((token: any) => token.kind === "facebook");
};
