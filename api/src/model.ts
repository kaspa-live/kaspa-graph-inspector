export type BlocksAndEdgesAndHeightGroups = {
    blocks: Block[],
    edges: Edge[],
    heightGroups: HeightGroup[],
};

export type Block = {
    id: number,
    blockHash: string,
    timestamp: number,
    parentIds: number[],
    height: number,
    daaScore: number,
    heightGroupIndex: number,
    selectedParentId: number | null,
    color: string,
    isInVirtualSelectedParentChain: boolean,
    mergeSetRedIds: number[],
    mergeSetBlueIds: number[],
};

export type Edge = {
    fromBlockId: number,
    toBlockId: number,
    fromHeight: number,
    toHeight: number,
    fromHeightGroupIndex: number,
    toHeightGroupIndex: number,
};

export type HeightGroup = {
    height: number,
    size: number,
};

export type BlockHashById = {
    id: number,
    hash: string,
};

export type AppConfig = {
    kaspadVersion: string,
    processingVersion: string,
    network: string,
    apiVersion: string,
}