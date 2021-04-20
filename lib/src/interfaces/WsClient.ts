import ws from 'ws';

export interface WsClient extends ws {
    buzy: boolean;
}
