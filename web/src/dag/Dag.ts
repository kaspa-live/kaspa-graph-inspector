import * as PIXI from 'pixi.js';
import TimelineContainer from "./TimelineContainer";
import {Block} from "./model/Block";
import {Ticker} from "@createjs/core";
import {BlocksAndEdgesAndHeightGroups} from "./model/BlocksAndEdgesAndHeightGroups";

export default class Dag {
    private readonly tickIntervalInMilliseconds = 1000;
    private readonly headHeightMarginMultiplier = 0.25;
    private readonly apiAddress: string;
    private readonly katnipAddress: string;

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

        this.apiAddress = this.resolveApiAddress();
        this.katnipAddress = this.resolveKatnipAddress();
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

    private resolveApiAddress = (): string => {
        const apiAddress = process.env.REACT_APP_API_ADDRESS;
        if (!apiAddress) {
            throw new Error("The REACT_APP_API_ADDRESS environment variable is required");
        }
        return `${window.location.protocol}//${apiAddress}`;
    }

    private resolveKatnipAddress = (): string => {
        const katnipAddress = process.env.REACT_APP_KATNIP_ADDRESS;
        if (!katnipAddress) {
            throw new Error("The REACT_APP_KATNIP_ADDRESS environment variable is required");
        }
        return `${window.location.protocol}//${katnipAddress}`;
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
        const response = await this.fetch(`${this.apiAddress}/blocksBetweenHeights?startHeight=${startHeight}&endHeight=${endHeight}`);

        // Exit early if the request failed
        if (!response) {
            return;
        }
        const blocksAndEdgesAndHeightGroups: BlocksAndEdgesAndHeightGroups = await response.json();

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
            this.timelineContainer!.setTargetHeight(targetBlock.height);
            this.timelineContainer!.setTargetBlock(targetBlock);
            this.targetBlockChangedListener(targetBlock);
        }

        const heightDifference = this.timelineContainer!.getMaxBlockAmountOnHalfTheScreen();
        const response = await this.fetch(`${this.apiAddress}/blockHash?blockHash=${targetHash}&heightDifference=${heightDifference}`);

        // Exit early if the request failed
        if (!response) {
            return;
        }
        const blocksAndEdgesAndHeightGroups: BlocksAndEdgesAndHeightGroups = await response.json();

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

        const response = await this.fetch(`${this.apiAddress}/head?heightDifference=${heightDifference}`);

        // Exit early if the request failed
        if (!response) {
            return;
        }
        const blocksAndEdgesAndHeightGroups: BlocksAndEdgesAndHeightGroups = await response.json();

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

    private handleBlockClicked = (block: Block) => {
        this.timelineContainer!.setTargetHeight(block.height);
        if (this.targetHash !== block.blockHash) {
            this.setStateTrackTargetBlock(block);
            return;
        }
        window.open(`${this.katnipAddress}/#/block/${block.blockHash}`, "'_blank'");
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
