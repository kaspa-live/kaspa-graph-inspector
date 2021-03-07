export type Block = {
    id: number,
    blockHash: string,
    timestamp: number,
    parentIds: number[],
    height: number,
    selectedParentId: number | null,
    color: string,
    isInVirtualSelectedParentChain: boolean,
};