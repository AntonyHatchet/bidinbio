import crypto, { Utf8AsciiLatin1Encoding } from "crypto";
import { Request, Response, NextFunction } from "express";

export const authorizeHook = (req: Request & {rawBody: any}, res: Response, next: NextFunction) => {
    const { query, rawBody, headers, method } = req;
    if (method === "GET") {
        return res.send(query["hub.challenge"]);
    }
    if (method === "POST") {
        const hmac = crypto.createHmac("sha1", process.env.FACEBOOK_SECRET);
        hmac.update(rawBody, "utf-8" as Utf8AsciiLatin1Encoding);
        if(headers["x-hub-signature"] === `sha1=${hmac.digest("hex")}`){
            console.log("Success");
            return next();
        }
    }
    res.sendStatus(401);
};