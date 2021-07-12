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
    mergeSetRedIds: number[],
    mergeSetBlueIds: number[],
};

export function areBlocksEqual(left: Block, right: Block): boolean {
    if (left.parentIds.length !== right.parentIds.length) {
        return false;
    }
    if (left.mergeSetRedIds.length !== right.mergeSetRedIds.length) {
        return false;
    }
    if (left.mergeSetBlueIds.length !== right.mergeSetBlueIds.length) {
        return false;
    }
    for (let i = 0; i < left.parentIds.length; i++) {
        if (left.parentIds[i] !== right.parentIds[i]) {
            return false;
        }
    }
    for (let i = 0; i < left.mergeSetRedIds.length; i++) {
        if (left.mergeSetRedIds[i] !== right.mergeSetRedIds[i]) {
            return false;
        }
    }
    for (let i = 0; i < right.mergeSetBlueIds.length; i++) {
        if (left.mergeSetBlueIds[i] !== right.mergeSetBlueIds[i]) {
            return false;
        }
    }
    return left.id === right.id
        && left.blockHash === right.blockHash
        && left.timestamp === right.timestamp
        && left.height === right.height
        && left.heightGroupIndex === right.heightGroupIndex
        && left.selectedParentId === right.selectedParentId
        && left.color === right.color
        && left.isInVirtualSelectedParentChain === right.isInVirtualSelectedParentChain;
}
