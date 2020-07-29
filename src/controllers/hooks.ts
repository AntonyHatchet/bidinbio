import crypto, { Utf8AsciiLatin1Encoding } from "crypto";
import { Request, Response, NextFunction } from "express";
import { handleCommentsHook, handleMentionsHook, handleStoryInsightsHook } from "../services/hooks.service";
import { createCommentForMedia } from "../services/instagram.service";

enum HookType {
    comments= "comments",
    mentions= "mentions",
    story_insights= "story_insights",
}

export const authorizeHook = (req: Request & {rawBody: any}, res: Response, next: NextFunction) => {
    const { query, rawBody, headers, method } = req;
    if (method === "GET") {
        return res.send(query["hub.challenge"]);
    }
    if (method === "POST") {
        const hmac = crypto.createHmac("sha1", process.env.FACEBOOK_SECRET);
        hmac.update(rawBody, "utf-8" as Utf8AsciiLatin1Encoding);
        if(headers["x-hub-signature"] === `sha1=${hmac.digest("hex")}`){
            return next();
        }
    }
    res.sendStatus(401);
};

export const hookRouter = (req: Request, res: Response) => {
    const { body } = req;
    if(body.object !== "instagram") {
        return;
    }

    console.log(body.entry);

    if(body && body.entry && body.entry[0] && body.entry[0].changes && body.entry[0].changes[0] && body.entry[0].changes[0].field) {
        switch(body.entry[0].changes[0].field) {
            case HookType.comments: {
                const { time, id: userId } = body.entry[0];
                const { id: commentId, text } = body.entry[0].changes[0].value;
                handleCommentsHook({ time, userId, text, commentId });
                break;
            }
            case HookType.mentions: {
                const { time, id: userId } = body.entry[0];
                const { media_id: mediaId } = body.entry[0].changes[0].value;
                handleMentionsHook({ time, userId, mediaId });
                break;
            }
            case HookType.story_insights:
                handleStoryInsightsHook(req.body.entry[0].changes[0].value);
                break;
            default:
                console.log("Unhandled hook type");
        }
    }
};