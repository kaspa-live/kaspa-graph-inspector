import * as PIXI from 'pixi.js';
import TimelineContainer from "./TimelineContainer";
import {Block} from "./model/Block";
import {Ticker} from "@createjs/core";
import {BlocksAndEdgesAndHeightGroups} from "./model/BlocksAndEdgesAndHeightGroups";
import {apiAddress} from "../addresses";

export default class Dag {
    private readonly tickIntervalInMilliseconds = 1000;
    private readonly headHeightMarginMultiplier = 0.25;

    private application: PIXI.Application | undefined;
    private timelineContainer: TimelineContainer | undefined;

    private currentWidth: number = 0;
    private currentHeight: number = 0;
    private currentTickId: number | undefined = undefined;
    private currentTickFunction: () => Promise<void>;

    private targetHeight: number | null = null;
    private targetHash: string | null = null;
    private isTrackingChangedListener: (isTracking: boolean) => void;
    private isFetchFailingListener: (isFailing: boolean) => void;
    private targetBlockChangedListener: (block: Block | null) => void;

    private readonly blockHashesByIds: { [id: string]: string } = {};

    constructor() {
        this.currentTickFunction = async () => {
            // Do nothing
        }
        this.isTrackingChangedListener = () => {
            // Do nothing
        }
        this.isFetchFailingListener = () => {
            // Do nothing
        }
        this.targetBlockChangedListener = () => {
            // Do nothing
        }

        // This sets TweenJS to use requestAnimationFrame.
        // Without it, it uses setTimeout, which makes
        // animations not as smooth as they should be
        Ticker.timingMode = Ticker.RAF;
    }

    initialize = (canvas: HTMLCanvasElement) => {
        this.application = new PIXI.Application({
            transparent: false,
            backgroundColor: 0xffffff,
            view: canvas,
            resizeTo: canvas,
            antialias: true,
        });

        this.timelineContainer = new TimelineContainer(this.application);
        this.timelineContainer.setBlockClickedListener(this.handleBlockClicked);
        this.timelineContainer.setHeightClickedListener(this.handleHeightClicked);
        this.application.ticker.add(this.resizeIfRequired);
        this.application.stage.addChild(this.timelineContainer);

        this.application.start();

        this.run();
    }

    private resizeIfRequired = () => {
        if (this.currentWidth !== this.application!.renderer.width
            || this.currentHeight !== this.application!.renderer.height) {
            this.currentWidth = this.application!.renderer.width;
            this.currentHeight = this.application!.renderer.height;

            this.timelineContainer!.recalculatePositions();
        }
    }

    private run = () => {
        window.clearTimeout(this.currentTickId);
        this.tick();
    }

    private tick = () => {
        const currentTickId = this.currentTickId;
        this.resolveTickFunction();
        this.currentTickFunction().then(() => {
            if (this.currentTickId === currentTickId) {
                this.scheduleNextTick();
            }
        });

        this.notifyIsTrackingChanged();
    }

    private resolveTickFunction = () => {
        const urlParams = new URLSearchParams(window.location.search);

        this.targetHeight = null;
        this.targetHash = null;

        const heightString = urlParams.get("height");
        if (heightString) {
            const height = parseInt(heightString);
            if (height || height === 0) {
                this.targetHeight = height;
                this.currentTickFunction = this.trackTargetHeight;
                return;
            }
        }

        const hash = urlParams.get("hash");
        if (hash) {
            this.targetHash = hash;
            this.currentTickFunction = this.trackTargetHash;
            return
        }

        this.currentTickFunction = this.trackHead;
    }

    private scheduleNextTick = () => {
        this.currentTickId = window.setTimeout(this.tick, this.tickIntervalInMilliseconds);
    }

    private trackTargetHeight = async () => {
        const targetHeight = this.targetHeight as number;
        this.timelineContainer!.setTargetHeight(targetHeight);
        this.timelineContainer!.setTargetBlock(null);
        this.targetBlockChangedListener(null);

        const [startHeight, endHeight] = this.timelineContainer!.getVisibleHeightRange(targetHeight);
        const response = await this.fetch(`${apiAddress}/blocksBetweenHeights?startHeight=${startHeight}&endHeight=${endHeight}`);

        // Exit early if the request failed
        if (!response) {
            return;
        }
        const blocksAndEdgesAndHeightGroups: BlocksAndEdgesAndHeightGroups = await response.json();
        this.cacheBlockHashes(blocksAndEdgesAndHeightGroups.blocks);

        // Exit early if the track function or the target
        // height changed while we were busy fetching data
        if (this.currentTickFunction !== this.trackTargetHeight || this.targetHeight !== targetHeight) {
            return;
        }

        this.timelineContainer!.setBlocksAndEdgesAndHeightGroups(blocksAndEdgesAndHeightGroups);
    }

    private trackTargetHash = async () => {
        const targetHash = this.targetHash as string;

        // Immediately update the timeline container if it already
        // contains the target block
        let targetBlock = this.timelineContainer!.findBlockWithHash(targetHash);
        if (targetBlock) {
            const [parentFoundHashes, parentNotFoundHashes] = this.getCachedBlockHashes(targetBlock.parentIds);
            console.log("parentIds:", parentFoundHashes, parentNotFoundHashes);

            if (targetBlock.selectedParentId) {
                const [selectedParentFoundHashes, selectedParentNotFoundHashes] = this.getCachedBlockHashes([targetBlock.selectedParentId]);
                console.log("selectedParentIds:", selectedParentFoundHashes, selectedParentNotFoundHashes);
            }

            this.timelineContainer!.setTargetHeight(targetBlock.height);
            this.timelineContainer!.setTargetBlock(targetBlock);
            this.targetBlockChangedListener(targetBlock);
        }

        const heightDifference = this.timelineContainer!.getMaxBlockAmountOnHalfTheScreen();
        const response = await this.fetch(`${apiAddress}/blockHash?blockHash=${targetHash}&heightDifference=${heightDifference}`);

        // Exit early if the request failed
        if (!response) {
            return;
        }
        const blocksAndEdgesAndHeightGroups: BlocksAndEdgesAndHeightGroups = await response.json();
        this.cacheBlockHashes(blocksAndEdgesAndHeightGroups.blocks);

        // Exit early if the track function or the target
        // hash changed while we were busy fetching data
        if (this.currentTickFunction !== this.trackTargetHash || this.targetHash !== targetHash) {
            return;
        }

        for (let block of blocksAndEdgesAndHeightGroups.blocks) {
            if (block.blockHash === targetHash) {
                targetBlock = block;
                break;
            }
        }

        // If we didn't find the target block in the response
        // something funny is going on. Print a warning and
        // exit
        if (!targetBlock) {
            console.error(`Block ${targetHash} not found in blockHash response ${response}`);
            return;
        }

        this.timelineContainer!.setTargetHeight(targetBlock.height);
        this.timelineContainer!.setBlocksAndEdgesAndHeightGroups(blocksAndEdgesAndHeightGroups, targetBlock);
        this.targetBlockChangedListener(targetBlock);
    }

    private trackHead = async () => {
        this.timelineContainer!.setTargetBlock(null);
        this.targetBlockChangedListener(null);

        const maxBlockAmountOnHalfTheScreen = this.timelineContainer!.getMaxBlockAmountOnHalfTheScreen();

        let headMargin = 0;
        const rendererWidth = this.application!.renderer.width;
        const rendererHeight = this.application!.renderer.height;
        if (rendererHeight < rendererWidth) {
            headMargin = Math.floor(maxBlockAmountOnHalfTheScreen * this.headHeightMarginMultiplier);
        }

        const heightDifference = maxBlockAmountOnHalfTheScreen + headMargin;

        const response = await this.fetch(`${apiAddress}/head?heightDifference=${heightDifference}`);

        // Exit early if the request failed
        if (!response) {
            return;
        }
        const blocksAndEdgesAndHeightGroups: BlocksAndEdgesAndHeightGroups = await response.json();
        this.cacheBlockHashes(blocksAndEdgesAndHeightGroups.blocks);

        // Exit early if the track function changed while we
        // were busy fetching data
        if (this.currentTickFunction !== this.trackHead) {
            return
        }

        let maxHeight = 0;
        for (let block of blocksAndEdgesAndHeightGroups.blocks) {
            if (block.height > maxHeight) {
                maxHeight = block.height;
            }
        }

        let targetHeight = maxHeight - headMargin;
        if (targetHeight < 0) {
            targetHeight = 0;
        }

        this.timelineContainer!.setTargetHeight(targetHeight);
        this.timelineContainer!.setBlocksAndEdgesAndHeightGroups(blocksAndEdgesAndHeightGroups);
    }

    private cacheBlockHashes = (blocks: Block[]) => {
        for (let block of blocks) {
            this.blockHashesByIds[block.id] = block.blockHash;
        }
    }

    private getCachedBlockHashes = (blockIds: number[]): [string[], string[]] => {
        const foundBlockHashes: string[] = [];
        const notFoundBlockHashes: string[] = [];
        for (let blockId of blockIds) {
            const blockHash = this.blockHashesByIds[blockId];
            if (blockHash) {
                foundBlockHashes.push(blockHash);
            } else {
                notFoundBlockHashes.push(blockHash);
            }
        }
        return [foundBlockHashes, notFoundBlockHashes];
    }

    private handleBlockClicked = (block: Block) => {
        this.timelineContainer!.setTargetHeight(block.height);
        this.setStateTrackTargetBlock(block);
    }

    private handleHeightClicked = (height: number) => {
        this.timelineContainer!.setTargetHeight(height);
        this.setStateTrackTargetHeight(height);
    }

    setStateTrackTargetBlock = (targetBlock: Block) => {
        const urlParams = new URLSearchParams();
        urlParams.set("hash", `${targetBlock.blockHash}`);
        window.history.pushState(null, "", `?${urlParams}`);
        this.run();
    }

    setStateTrackTargetHeight = (targetHeight: number) => {
        const urlParams = new URLSearchParams();
        urlParams.set("height", `${targetHeight}`);
        window.history.pushState(null, "", `?${urlParams}`);
        this.run();
    }

    setStateTrackHead = () => {
        window.history.pushState(null, "", "?");
        this.run();
    }

    setIsTrackingChangedListener = (isTrackingChangedListener: (isTracking: boolean) => void) => {
        this.isTrackingChangedListener = isTrackingChangedListener;
    }

    setIsFetchFailingListener = (isFetchFailingListener: (isFailing: boolean) => void) => {
        this.isFetchFailingListener = isFetchFailingListener;
    }

    setTargetBlockChangedListener = (targetBlockChangedListener: (block: Block | null) => void) => {
        this.targetBlockChangedListener = targetBlockChangedListener;
    }

    private fetch = (url: string): Promise<Response | void> => {
        return fetch(url)
            .catch(_ => {
                // Do nothing
            })
            .then(response => {
                this.isFetchFailingListener(!response);
                return response;
            });
    }

    private notifyIsTrackingChanged = () => {
        const isTracking = this.currentTickFunction === this.trackHead
        this.isTrackingChangedListener(isTracking);
    }

    stop = () => {
        if (this.application) {
            this.application.stop();
        }
    }
}
