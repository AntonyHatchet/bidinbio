"use strict";

import axios from "axios";
import { Response, Request, NextFunction } from "express";
import { AuthToken, User, UserDocument } from "../models/User";
import {
    getBusinessAccount,
    getFacebookUser,
    getLongTermUserKey,
    getPageToken,
    getAPIPermissions,
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
    const longTermToken = await getLongTermUserKey(token.accessToken);

    const me = await getFacebookUser(token.accessToken);
    const { data: permissions } = await getAPIPermissions(user.facebookAccountId, longTermToken);
    const accounts = me.accounts || { data: []};
    const instagramBusinessAccountIds = new Set<string>();
    console.log(permissions);
    user.permissions = permissions;

    await user.save();

    // console.log(user)
    for(const account of accounts.data) {
        const { instagramBusinessAccount } = await getBusinessAccount({ 
            facebookAccountId: account.id, 
            token: token.accessToken,
            userId: user._id,
        });
        if(instagramBusinessAccount) {
            instagramBusinessAccountIds.add(instagramBusinessAccount.id);
        }
    }

    const IGUsers = [];
    for(const igAccountId of instagramBusinessAccountIds) {
        const account = await loadIGUser({igAccountId, token: token.accessToken});
        IGUsers.push(account);
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
