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
    heightGroupIndex: number,
    selectedParentId: number | null,
    color: string,
    isInVirtualSelectedParentChain: boolean,
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
