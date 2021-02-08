import { VideoOptions } from "./VideoOptions";

export interface StreamOptions {
    videoOptions?: VideoOptions;
    dynamic?: boolean;
    limit?: number;
}