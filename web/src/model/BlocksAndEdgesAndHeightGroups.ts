import {areBlocksEqual, Block} from "./Block";
import {areEdgesEqual, Edge} from "./Edge";
import {areHeightGroupsEqual, HeightGroup} from "./HeightGroup";

export type BlocksAndEdgesAndHeightGroups = {
    blocks: Block[],
    edges: Edge[],
    heightGroups: HeightGroup[],
}

export function areBlocksAndEdgesAndHeightGroupsEqual(
    left: BlocksAndEdgesAndHeightGroups, right: BlocksAndEdgesAndHeightGroups): boolean {

    if (left.blocks.length !== right.blocks.length) {
        return false;
    }
    if (left.edges.length !== right.edges.length) {
        return false;
    }
    if (left.heightGroups.length !== right.heightGroups.length) {
        return false;
    }
    for (let i = 0; i < left.blocks.length; i++) {
        if (!areBlocksEqual(left.blocks[i], right.blocks[i])) {
            return false;
        }
    }
    for (let i = 0; i < left.edges.length; i++) {
        if (!areEdgesEqual(left.edges[i], right.edges[i])) {
            return false;
        }
    }
    for (let i = 0; i < left.heightGroups.length; i++) {
        if (!areHeightGroupsEqual(left.heightGroups[i], right.heightGroups[i])) {
            return false;
        }
    }
    return true;
}

function getMinHeight(data: BlocksAndEdgesAndHeightGroups): number {
    var height = Number.MAX_SAFE_INTEGER;
    for (let groupHeight of data.heightGroups) {
        height = Math.min(height, groupHeight.height);
    }
    return height;
}

function getMaxHeight(data: BlocksAndEdgesAndHeightGroups): number {
    var height = -1;
    for (let groupHeight of data.heightGroups) {
        height = Math.max(height, groupHeight.height);
    }
    return height;
}

export function getHeightGroupDAAScore(data: BlocksAndEdgesAndHeightGroups, height: number): number {
  var score = 0;
  for (let block of data.blocks) {
    if (block.height === height) {
        if (block.isInVirtualSelectedParentChain || score === 0) {
          score = block.daaScore;
        }
    }
  }
  return score;
}

export function getDAAScoreGroupHeight(data: BlocksAndEdgesAndHeightGroups, daaScore: number): number {
    const minHeight = getMinHeight(data);
    const maxHeight = getMaxHeight(data);
    for (let i =  minHeight; i <= maxHeight; i++) {
        if (getHeightGroupDAAScore(data, i) >= daaScore) {
            return i;
        }
    }
    return maxHeight;
}

function getBlockById(data: BlocksAndEdgesAndHeightGroups, blockId: number): Block | null {
    if (data) {
        for (let block of data.blocks) {
            if (block.id === blockId) {
                return block;
            }
        }
    }
    return null;
}

export function getBlockChildIds(data: BlocksAndEdgesAndHeightGroups, block: Block): [number[], number | null] {
    let children: number[] = [];
    let selectedChild = null;
    if (data) { 
        for (let edge of data.edges) {
            if (edge.toBlockId === block.id) {
                children = children.concat(edge.fromBlockId);
                const childBlock = getBlockById(data, edge.fromBlockId);
                if (childBlock && childBlock.isInVirtualSelectedParentChain) {
                    selectedChild = childBlock.id;
                }
            }
        }
    }
    return [children, selectedChild];
}