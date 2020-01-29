/* ==================================================
(c) 2019 Copyright Transledger inc. All rights reserved 
================================================== */

export interface Network {
    host: string,
    port: number,
    protocol: string,
    chainId: string
}

export interface Parameters {
    contractAddress: string,
    exchangeAddress: string,
    network: Network
}