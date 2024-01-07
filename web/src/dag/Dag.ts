import * as PIXI from "pixi.js-legacy";
import TimelineContainer from "./TimelineContainer";
import {Block} from "../model/Block";
import {getBlockChildIds} from "../model/BlocksAndEdgesAndHeightGroups"
import {Ticker} from "@createjs/core";
import {BlockInformation} from "../model/BlockInformation";
import DataSource, {resolveDataSource} from "../data/DataSource";
import { theme } from "./Theme";
import { AppConfig, areAppConfigsEqual, getDefaultAppConfig } from "../model/AppConfig";

export default class Dag {
    private application: PIXI.Application | undefined;
    private timelineContainer: TimelineContainer | undefined;
    private dataSource: DataSource | undefined;
    private tickIntervalInMilliseconds: number | undefined;
    private appConfig: AppConfig | undefined;

    private currentScale: number = 0.2;
    private currentWidth: number = 0;
    private currentHeight: number = 0;
    private currentTickId: number | undefined = undefined;
    private currentTickFunction: () => Promise<void>;

    private targetHeight: number | null = null;
    private targetDAAScore: number | null = null;
    private targetHash: string | null = null;
    private isTrackingChangedListener: (isTracking: boolean) => void;
    private isFetchFailingListener: (isFailing: boolean) => void;
    private blockInformationChangedListener: (blockInformation: BlockInformation | null) => void;
    private blockClickedListener: (blockInformation: Block) => void;
    private appConfigChangedListener: (appConfig: AppConfig) => void;

    private readonly blockHashesByIds: { [id: string]: string } = {};

    constructor() {
        this.appConfig = getDefaultAppConfig();
        this.currentTickFunction = async () => {
            // Do nothing
        }
        this.isTrackingChangedListener = () => {
            // Do nothing
        }
        this.isFetchFailingListener = () => {
            // Do nothing
        }
        this.blockInformationChangedListener = () => {
            // Do nothing
        }
        this.blockClickedListener = () => {
            // Do nothing
        }
        this.appConfigChangedListener = () => {
            // Do nothing
        }

        // This sets TweenJS to use requestAnimationFrame.
        // Without it, it uses setTimeout, which makes
        // animations not as smooth as they should be
        Ticker.timingMode = Ticker.RAF;
    }

    initialize = (canvas: HTMLCanvasElement) => {
        const dpr = window.devicePixelRatio || 1;
        const parentElement = canvas.parentElement!;

        this.application = new PIXI.Application({
            backgroundColor: theme.components.dag.backgroundColor,
            view: canvas,
            resizeTo: parentElement,
            antialias: true,
            resolution: dpr,
            autoDensity: true,
        });

        this.timelineContainer = new TimelineContainer(this.application);
        this.timelineContainer.setBlockClickedListener(this.handleBlockClicked);
        this.timelineContainer.setDAAScoreClickedListener(this.handleDAAScoreClicked);
        this.timelineContainer.setScaleGetter(this.getScale);
        this.application.ticker.add(this.resizeIfRequired);
        this.application.stage.addChild(this.timelineContainer);

        this.application.start();

        resolveDataSource()
            .then(dataSource => {
                this.dataSource = dataSource;
                this.tickIntervalInMilliseconds = dataSource.getTickIntervalInMilliseconds();

                this.dataSource!.getAppConfig()
                    .then(appConfig => {
                        if (appConfig) {
                            this.setAppConfig(appConfig);
                        } else {
                            this.resetAppConfig();
                        }
                    })
                    .catch(_ => {
                        this.resetAppConfig();
                    });

                this.run();
        });

        this.resize();
    }

    resize = () => {
        const dpr = window.devicePixelRatio || 1;
        const renderer = this.application?.renderer!;
        const resizeTo = this.application?.resizeTo as HTMLDivElement;

        // When simulating another device,
        // ie using Chrome development [Toggle Device Toolbar] tool.
        if (renderer.resolution !== dpr) {
            renderer.resolution = dpr;
            renderer.resize(resizeTo.clientWidth, resizeTo.clientHeight)
            renderer.plugins.interaction.resolution = renderer.resolution;
        }

        // Debugging Renderer Resolution
        //
        // const pixicanvas = this.application?.view!;
        // const debugMsg = "Device pixel ratio: " + renderer.resolution + "\n" + 
        //                  "Window size       : " + window.innerWidth + "," + window.innerHeight + "\n" +
        //                  "Client size       : " + pixicanvas.clientWidth + "," + pixicanvas.clientHeight + "\n" +
        //                  "Canvas size       : " + pixicanvas.width + "," + pixicanvas.height + "\n" +
        //                  "Renderer view     : " + renderer.view.width + "," + renderer.view.height + "\n" + 
        //                  "Renderer screen   : " + renderer.screen.width + "," + renderer.screen.height;
        // console.log(debugMsg);
        
        // Recalculate the scene contents
        this.timelineContainer!.recalculatePositions();
    }
    

    private resetAppConfig = () => {
        this.setAppConfig(getDefaultAppConfig())
    }

    private setAppConfig = (appConfig: AppConfig) => {
        if (!this.appConfig || !areAppConfigsEqual(appConfig, this.appConfig)) {
            this.appConfig = appConfig;
            this.appConfigChangedListener(this.appConfig);
        }
    }

    private resizeIfRequired = () => {
        if (this.currentWidth !== this.getDisplayWidth()
            || this.currentHeight !== this.getDisplayHeight()) {
            this.currentWidth = this.getDisplayWidth();
            this.currentHeight = this.getDisplayHeight();
            this.resize();
        }
    }

    getDisplayHeight = () => this.application!.renderer.screen.height;
    getDisplayWidth = () => this.application!.renderer.screen.width;

    getScale = () => this.currentScale;
    setScale = (scale: number) => {
        const boundedScale = Math.round(Math.max(0.2, Math.min(scale, 1.2)) * 10) / 10;
        if (boundedScale !== this.currentScale) {
            this.currentScale = boundedScale;
            this.resize();
        }
    }

    zoomIn = () => { this.setScale(this.currentScale - 0.1) };
    zoomOut = () => { this.setScale(this.currentScale + 0.1) };

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

        const daaScoreString = urlParams.get("daascore");
        if (daaScoreString) {
            const daaScore = parseInt(daaScoreString);
            if (daaScore || daaScore === 0) {
                this.targetDAAScore = daaScore;
                this.currentTickFunction = this.trackTargetDAAScore;
                return;
            }
        }

        const hash = urlParams.get("hash");
        if (hash) {
            this.targetHash = hash.toLowerCase();
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
        this.blockInformationChangedListener(null);

        const [startHeight, endHeight] = this.timelineContainer!.getVisibleHeightRange(targetHeight);
        const blocksAndEdgesAndHeightGroups = await this.dataSource!.getBlocksBetweenHeights(startHeight, endHeight);
        this.isFetchFailingListener(!blocksAndEdgesAndHeightGroups);

        // Exit early if the request failed
        if (!blocksAndEdgesAndHeightGroups) {
            return;
        }
        this.cacheBlockHashes(blocksAndEdgesAndHeightGroups.blocks);

        // Exit early if the track function or the target
        // height changed while we were busy fetching data
        if (this.currentTickFunction !== this.trackTargetHeight || this.targetHeight !== targetHeight) {
            return;
        }

        this.timelineContainer!.setTargetHeight(targetHeight, blocksAndEdgesAndHeightGroups);
        this.timelineContainer!.setBlocksAndEdgesAndHeightGroups(blocksAndEdgesAndHeightGroups);
    }

    private trackTargetDAAScore = async () => {
        const targetDAAScore = this.targetDAAScore as number;
        this.timelineContainer!.setTargetDAAScore(targetDAAScore);
        this.timelineContainer!.setTargetBlock(null);
        this.blockInformationChangedListener(null);

        const heightDifference = this.timelineContainer!.getMaxBlockAmountOnHalfTheScreen();
        const blocksAndEdgesAndHeightGroups = await this.dataSource!.getBlockDAAScore(targetDAAScore, heightDifference);
        this.isFetchFailingListener(!blocksAndEdgesAndHeightGroups);

        // Exit early if the request failed
        if (!blocksAndEdgesAndHeightGroups) {
            return;
        }
        this.cacheBlockHashes(blocksAndEdgesAndHeightGroups.blocks);

        // Exit early if the track function or the target
        // height changed while we were busy fetching data
        if (this.currentTickFunction !== this.trackTargetDAAScore || this.targetDAAScore !== targetDAAScore) {
            return;
        }

        this.timelineContainer!.setBlocksAndEdgesAndHeightGroups(blocksAndEdgesAndHeightGroups);
        this.timelineContainer!.setTargetDAAScore(targetDAAScore);
    }

    private trackTargetHash = async () => {
        const targetHash = this.targetHash as string;

        // Immediately update the timeline container if it already
        // contains the target block
        let targetBlock = this.timelineContainer!.findBlockWithHash(targetHash);
        if (targetBlock) {
            this.timelineContainer!.setTargetHeight(targetBlock.height);
            this.timelineContainer!.setTargetBlock(targetBlock);

            const blockInformation = await this.buildBlockInformation(targetBlock);
            this.blockInformationChangedListener(blockInformation);
        }

        const heightDifference = this.timelineContainer!.getMaxBlockAmountOnHalfTheScreen();
        const blocksAndEdgesAndHeightGroups = await this.dataSource!.getBlockHash(targetHash, heightDifference);
        this.isFetchFailingListener(!blocksAndEdgesAndHeightGroups);

        // Exit early if the request failed
        if (!blocksAndEdgesAndHeightGroups) {
            return;
        }
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
            console.error(`Block ${targetHash} not found in blockHash response ${blocksAndEdgesAndHeightGroups}`);
            return;
        }

        this.timelineContainer!.setTargetHeight(targetBlock.height, blocksAndEdgesAndHeightGroups);
        this.timelineContainer!.setBlocksAndEdgesAndHeightGroups(blocksAndEdgesAndHeightGroups, targetBlock);

        const blockInformation = await this.buildBlockInformation(targetBlock);
        this.blockInformationChangedListener(blockInformation);
    }

    private trackHead = async () => {
        this.timelineContainer!.setTargetBlock(null);
        this.blockInformationChangedListener(null);

        const maxBlockAmountOnHalfTheScreen = this.timelineContainer!.getMaxBlockAmountOnHalfTheScreen();

        const heightDifference = this.timelineContainer!.getVisibleSlotAmountAfterHalfTheScreen(theme.components.dag.headMinRightMargin);
        const blocksAndEdgesAndHeightGroups = await this.dataSource!.getHead(maxBlockAmountOnHalfTheScreen + heightDifference);
        this.isFetchFailingListener(!blocksAndEdgesAndHeightGroups);

        // Exit early if the request failed
        if (!blocksAndEdgesAndHeightGroups) {
            return;
        }
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

        let targetHeight = Math.max(0, maxHeight - heightDifference);

        this.timelineContainer!.setTargetHeight(targetHeight, blocksAndEdgesAndHeightGroups);
        this.timelineContainer!.setBlocksAndEdgesAndHeightGroups(blocksAndEdgesAndHeightGroups);
    }

    private cacheBlockHashes = (blocks: Block[]) => {
        for (let block of blocks) {
            this.blockHashesByIds[block.id] = block.blockHash;
        }
    }

    private getCachedBlockHashes = (blockIds: number[]): [string[], number[]] => {
        const foundBlockHashes: string[] = [];
        const notFoundBlockIds: number[] = [];
        for (let blockId of blockIds) {
            const blockHash = this.blockHashesByIds[blockId];
            if (blockHash) {
                foundBlockHashes.push(blockHash);
            } else {
                notFoundBlockIds.push(blockId);
            }
        }
        return [foundBlockHashes, notFoundBlockIds];
    }

    private buildBlockInformation = async (block: Block): Promise<BlockInformation> => {
        let notFoundIds: number[] = [];

        let [parentHashes, notFoundParentIds] = this.getCachedBlockHashes(block.parentIds);
        notFoundIds = notFoundIds.concat(notFoundParentIds);

        let selectedParentHash = null;
        if (block.selectedParentId) {
            const [selectedParentHashes, notFoundSelectedParentIds] = this.getCachedBlockHashes([block.selectedParentId]);
            notFoundIds = notFoundIds.concat(notFoundSelectedParentIds);

            selectedParentHash = selectedParentHashes[0];
        }

        let [mergeSetRedHashes, notFoundMergeSetRedIds] = this.getCachedBlockHashes(block.mergeSetRedIds);
        notFoundIds = notFoundIds.concat(notFoundMergeSetRedIds);

        let [mergeSetBlueHashes, notFoundMergeSetBlueIds] = this.getCachedBlockHashes(block.mergeSetBlueIds);
        notFoundIds = notFoundIds.concat(notFoundMergeSetBlueIds);

        const [childIds, selectedChildId] = getBlockChildIds(this.timelineContainer!.gettBlocksAndEdgesAndHeightGroups()!, block);
        let [childHashes, notFoundChildIds] = this.getCachedBlockHashes(childIds);
        notFoundIds = notFoundIds.concat(notFoundChildIds);

        let selectedChildHash = null;
        if (selectedChildId) {
            const [selectedChildHashes] = this.getCachedBlockHashes([selectedChildId]);
            selectedChildHash = selectedChildHashes[0];
        }

        if (notFoundIds.length > 0) {
            const blockHashesByIds = await this.dataSource!.getBlockHashesByIds(notFoundIds.join(","));
            if (blockHashesByIds) {
                for (let blockHashById of blockHashesByIds) {
                    // Feed the cache
                    this.blockHashesByIds[blockHashById.id] = blockHashById.hash;

                    // Propagate the found hashes

                    if (notFoundParentIds.includes(blockHashById.id)) {
                        parentHashes = parentHashes.concat(blockHashById.hash);
                    }
                    
                    if (block.selectedParentId === blockHashById.id) {
                        selectedParentHash = blockHashById.hash;
                    }
                    
                    if (notFoundMergeSetRedIds.includes(blockHashById.id)) {
                        mergeSetBlueHashes = mergeSetBlueHashes.concat(blockHashById.hash);
                    }
                    
                    if (notFoundMergeSetBlueIds.includes(blockHashById.id)) {
                        mergeSetBlueHashes = mergeSetBlueHashes.concat(blockHashById.hash);
                    }
                    
                    if (notFoundChildIds.includes(blockHashById.id)) {
                        childHashes = childHashes.concat(blockHashById.hash);
                    }
                    
                    if (selectedChildId === blockHashById.id) {
                        selectedChildHash = blockHashById.hash;
                    }
                }
            }
        }

        return {
            block: block,
            parentHashes: parentHashes,
            selectedParentHash: selectedParentHash,
            mergeSetRedHashes: mergeSetRedHashes,
            mergeSetBlueHashes: mergeSetBlueHashes,
            childHashes: childHashes,
            selectedChildHash: selectedChildHash,

            isInformationComplete: notFoundIds.length === 0,
        };
    }

    private handleBlockClicked = (block: Block) => {
        this.blockClickedListener(block);
        this.timelineContainer!.setTargetHeight(block.height);
        this.blockClickedListener(block);
        this.setStateTrackTargetBlock(block);
    }

    private handleDAAScoreClicked = (daaScore: number) => {
        this.timelineContainer!.setTargetDAAScore(daaScore);
        this.setStateTrackTargetDAAScore(daaScore);
    }

    setStateTrackTargetBlock = (targetBlock: Block) => {
        const urlParams = this.initializeUrlSearchParams();
        urlParams.set("hash", `${targetBlock.blockHash}`);
        window.history.pushState(null, "", `?${urlParams}`);
        this.run();
    }

    setStateTrackTargetHash = (targethash: string) => {
        const urlParams = this.initializeUrlSearchParams();
        urlParams.set("hash", `${targethash}`);
        window.history.pushState(null, "", `?${urlParams}`);
        this.run();
    }

    setStateTrackTargetHeight = (targetHeight: number) => {
        const urlParams = this.initializeUrlSearchParams();
        urlParams.set("height", `${targetHeight}`);
        window.history.pushState(null, "", `?${urlParams}`);
        this.run();
    }

    setStateTrackTargetDAAScore = (targetDAAScore: number) => {
        const urlParams = this.initializeUrlSearchParams();
        urlParams.set("daascore", `${targetDAAScore}`);
        window.history.pushState(null, "", `?${urlParams}`);
        this.run();
    }

    setStateTrackCurrent = () => {
        const targetDAAScore = this.timelineContainer!.getTargetDAAScore();
        this.setStateTrackTargetDAAScore(targetDAAScore);
    }

    setStateTrackHead = () => {
        const urlParams = this.initializeUrlSearchParams();
        window.history.pushState(null, "", `?${urlParams}`);
        this.run();
    }

    private initializeUrlSearchParams = (): URLSearchParams => {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete("hash");
        urlParams.delete("height");
        urlParams.delete("daascore");
        return urlParams;
    }

    setIsTrackingChangedListener = (isTrackingChangedListener: (isTracking: boolean) => void) => {
        this.isTrackingChangedListener = isTrackingChangedListener;
    }

    setIsFetchFailingListener = (isFetchFailingListener: (isFailing: boolean) => void) => {
        this.isFetchFailingListener = isFetchFailingListener;
    }

    setBlockInformationChangedListener = (BlockInformationChangedListener: (blockInformation: BlockInformation | null) => void) => {
        this.blockInformationChangedListener = BlockInformationChangedListener;
    }

    setBlockClickedListener = (BlockClickedListener: (block: Block) => void) => {
        this.blockClickedListener = BlockClickedListener;
    }

    setAppConfigChangedListener = (AppConfigChangedListener: (appConfig: AppConfig | null) => void) => {
        this.appConfigChangedListener = AppConfigChangedListener;
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
