import { IGUser } from "./User";

enum MediaType {
    IMAGE= "IMAGE", VIDEO= "VIDEO", CAROUSEL_ALBUM= "CAROUSEL_ALBUM",
}

export interface Media {
    caption?: string; // (excludes album children)
    children: any; // (carousel albums only)
    comments: any[]; // (excludes album children, replies to comments, and the caption)
    comments_count: number; // (excludes album children and the caption, includes replies)
    id: string;
    ig_id: string; 
    is_comment_enabled: boolean; // (excludes album children)
    like_count: number; // (excludes album children and likes on promoted posts created from the media object, includes replies)
    media_type: MediaType;
    media_url: string; // (not available on video IG Media objects that have been flagged for copyright violations)
    owner: IGUser; // (only returned if the IG User making the query also owns the IG Media object, otherwise the username field will be included)
    permalink: string;
    shortcode: string;
    thumbnail_url: string; // (only available on video IG Media objects)
    timestamp: Date; // ISO 8601 formatted creation date in UTC (default is UTC ±00:00)
    username: string;
}
