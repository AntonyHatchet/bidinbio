import bcrypt from "bcrypt-nodejs";
import crypto from "crypto";
import mongoose from "mongoose";

//@typescript-eslint/interface-name-prefix
export interface IGUser {
    biography: any;
    id: string;
    ig_id: string;
    followers_count: number;
    follows_count: number;
    media_count: number;
    name: string;
    profile_picture_url: string;
    username: string;
    website: string;
}
interface BusinessAccountInfo {
    id: string;
    pageId: string;
    subscribed: boolean;
}
export type UserDocument = mongoose.Document & {
    email: string;
    password: string;
    passwordResetToken: string;
    passwordResetExpires: Date;

    facebookAccountId: string;
    tokens: AuthToken[];

    profile: {
        name: string;
        gender: string;
        location: string;
        website: string;
        picture: string;
        username: string;
    };

    businessAccounts: {
        facebook: BusinessAccountInfo[];
    };

    comparePassword: comparePasswordFunction;
    gravatar: (size: number) => string;

    permissions: [
        {
            permission: string;
            status: string;
        },
    ];
};

type comparePasswordFunction = (candidatePassword: string, cb: (err: any, isMatch: any) => {}) => void;

export interface AuthToken {
    accessToken: string;
    kind: string;
    longLiveToken: string;
}

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String,
    passwordResetToken: String,
    passwordResetExpires: Date,

    facebookAccountId: String,
    twitterAccountId: String,
    googleAccountId: String,
    tokens: Array,

    profile: {
        name: String,
        gender: String,
        location: String,
        website: String,
        picture: String,
        username: String
    },
    businessAccounts: {
        facebook: Array,
    },
    permissions: [
        {
            permission: String,
            status: String
        },
    ]
}, { timestamps: true });

/**
 * Password hash middleware.
 */
userSchema.pre("save", function save(next) {
    const user = this as UserDocument;
    if (!user.isModified("password")) { return next(); }
    bcrypt.genSalt(10, (err, salt) => {
        if (err) { return next(err); }
        bcrypt.hash(user.password, salt, undefined, (err: mongoose.Error, hash) => {
            if (err) { return next(err); }
            user.password = hash;
            next();
        });
    });
});

const comparePassword: comparePasswordFunction = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, (err: mongoose.Error, isMatch: boolean) => {
        cb(err, isMatch);
    });
};

userSchema.methods.comparePassword = comparePassword;

/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = function (size: number = 200) {
    if (!this.email) {
        return `https://gravatar.com/avatar/?s=${size}&d=retro`;
    }
    const md5 = crypto.createHash("md5").update(this.email).digest("hex");
    return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

export const User = mongoose.model<UserDocument>("User", userSchema);
