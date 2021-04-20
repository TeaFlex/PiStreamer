/// <reference types="node" />

declare module 'stream-split' {
    import { 
        Transform, 
        TransformOptions, 
        TransformCallback
    } from "stream";
    
    /**
     * A very efficient stream splitter (using buffer delimiters).
     * Generate a duplex stream (transform) that split your stream into controlled chunks.
     * @author 131
     * @link https://github.com/131/stream-split
     */
    declare class Splitter extends Transform {
        constructor(separator: Buffer, options?: TransformOptions);
    }

    export default Splitter;
};