import async from "async";
import crypto from "crypto";
import nodemailer from "nodemailer";
import passport from "passport";
import { User, UserDocument, AuthToken } from "../models/User";
import { Request, Response, NextFunction } from "express";
import { IVerifyOptions } from "passport-local";
import { WriteError } from "mongodb";
import { check, sanitize, validationResult } from "express-validator";
import { loadIGUser, loadAllMedia } from "../services/instagram.service";

import "../config/passport";

/**
 * GET /login
 * Login page.
 */
export const getLogin = (req: Request, res: Response) => {
    if (req.user) {
        return res.redirect("/api/facebook");
    }
    res.render("account/login", {
        title: "Login"
    });
};

/**
 * GET /logout
 * Log out.
 */
export const logout = (req: Request, res: Response) => {
    req.logout();
    res.redirect("/");
};

/**
 * GET /account
 * Profile page.
 */
export const getAccount = (req: Request, res: Response) => {
    res.render("account/profile", {
        title: "Account Management"
    });
};

/**
 * POST /account/profile
 * Update profile information.
 */
export const postUpdateProfile = async (req: Request, res: Response, next: NextFunction) => {
    await check("email", "Please enter a valid email address.").isEmail().run(req);
    // eslint-disable-next-line @typescript-eslint/camelcase
    await sanitize("email").normalizeEmail({ gmail_remove_dots: false }).run(req);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        req.flash("errors", errors.array());
        return res.redirect("/account");
    }

    const user = req.user as UserDocument;
    User.findById(user.id, (err, user: UserDocument) => {
        if (err) { return next(err); }
        user.email = req.body.email || "";
        user.profile.name = req.body.name || "";
        user.profile.gender = req.body.gender || "";
        user.profile.location = req.body.location || "";
        user.profile.website = req.body.website || "";
        user.save((err: WriteError) => {
            if (err) {
                if (err.code === 11000) {
                    req.flash("errors", { msg: "The email address you have entered is already associated with an account." });
                    return res.redirect("/account");
                }
                return next(err);
            }
            req.flash("success", { msg: "Profile information has been updated." });
            res.redirect("/account");
        });
    });
};

/**
 * POST /account/delete
 * Delete user account.
 */
export const postDeleteAccount = (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as UserDocument;
    User.remove({ _id: user.id }, (err) => {
        if (err) { return next(err); }
        req.logout();
        req.flash("info", { msg: "Your account has been deleted." });
        res.redirect("/");
    });
};

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
export const getOauthUnlink = (req: Request, res: Response, next: NextFunction) => {
    const provider = req.params.provider;
    const user = req.user as UserDocument;
    User.findById(user.id, (err, user: any) => {
        if (err) { return next(err); }
        user[provider] = undefined;
        user.tokens = user.tokens.filter((token: AuthToken) => token.kind !== provider);
        user.save((err: WriteError) => {
            if (err) { return next(err); }
            req.flash("info", { msg: `${provider} account has been unlinked.` });
            res.redirect("/account");
        });
    });
};
