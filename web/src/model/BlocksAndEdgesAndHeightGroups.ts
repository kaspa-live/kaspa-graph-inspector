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
    var height = 0;
    for (let block of data.blocks) {
      if (block.daaScore === daaScore) {
          if (block.isInVirtualSelectedParentChain || height === 0) {
            height = block.height;
          }
      }
    }
    return height;
  }