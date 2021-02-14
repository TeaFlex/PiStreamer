import { ImageEffects } from "../enums/ImageEffects";

export interface VideoOptions {
    height?: number;
    width?: number;
    framerate?: number;
    hFlip?: boolean;
    vFlip?: boolean;
    brightness?: number;
    contrast?: number;
    sharpness?: number;
    saturation?: number;
    imxfx?: ImageEffects;
}