import {ReplayData} from "../ReplayDataSource";

export const test: ReplayData = {
    blockInterval: 1000,
    blocks: [
        {
            id: 0,
            parentIds: [],
            selectedParentId: null,
            color: "blue",
            isInVirtualSelectedParentChain: true,
            mergeSetRedIds: [],
            mergeSetBlueIds: [],
        },
        {
            id: 1,
            parentIds: [0],
            selectedParentId: 0,
            color: "blue",
            isInVirtualSelectedParentChain: true,
            mergeSetRedIds: [],
            mergeSetBlueIds: [0],
        },
        {
            id: 2,
            parentIds: [0],
            selectedParentId: 0,
            color: "blue",
            isInVirtualSelectedParentChain: false,
            mergeSetRedIds: [],
            mergeSetBlueIds: [0],
        },
        {
            id: 3,
            parentIds: [1, 2],
            selectedParentId: 1,
            color: "blue",
            isInVirtualSelectedParentChain: true,
            mergeSetRedIds: [],
            mergeSetBlueIds: [1, 2],
        },
    ],
}
