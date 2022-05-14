import { TextStyleFontWeight } from "pixi.js-legacy";

export interface BasePaletteColor  {
    main: number;
    highlight: number;
    contrastText: number;
}

export interface BlockLayout {
    color: BasePaletteColor;
    border: {
        color: number;
        width: number;
    }
}

export interface HighlightFrame {
    alpha: number,
    lineWidth: number
    offset: number;
}

export interface EdgeLayout {
    color: number;
    lineWidth: number;
    arrowRadius:  number;
}

export interface Theme {
    components: {
        block: {
            roundingRadius: number;
            blue: BlockLayout;
            red: BlockLayout;
            gray: BlockLayout;
            focus: HighlightFrame;
            highlight: HighlightFrame;
            scale: {
                default: number;
                hover: number;
            }
            text: {
                fontFamily: string;
                fontWeight: TextStyleFontWeight;
                multiplier: {
                    size: number;
                }
            }
        }

        dag: {
            backgroundColor: number;
            // Minimum right margin in pixels of DAG head in timeline
            headMinRightMargin: number;
            scaling: {
                // the block size for which all components dimensions are meant
                referenceBlockSize: number;
            }
        }

        edge: {
            normal: EdgeLayout;
            virtualChain: EdgeLayout;
            highlighted: {
                parent: EdgeLayout;
                child: EdgeLayout;
                selected: EdgeLayout;
                virtualChain: {
                    parent: EdgeLayout;
                    child: EdgeLayout;    
                }
                markRadius: number;
                minBorderIncrease: number;
            }
        }

        height: {
            color: BasePaletteColor;
            text: {
                fontFamily: string;
                fontWeight: TextStyleFontWeight;
                multiplier: {
                    size: number;
                    bottomMargin: number;
                }
            }
        },

        timeline: {
            maxBlocksPerHeight: number;
            multiplier: {
                margin: number;
            }
            visibleHeightRangePadding: number;
        }
    }

    scale: (measure: number, blockSize: number) => number;
};

export const theme: Theme = {
    components: {
        block: {
            roundingRadius: 10,             // Stas original: 10
            blue: {
                color: {
                    main: 0x5581AA,         // Stas original: 0xb4cfed,
                    highlight: 0x85a2c1,    // Stas original: 0x49849e
                                            // https://fffuel.co/cccolor/ - 0x5581AA - Tint palette 3
                    contrastText: 0xffffff, // Stas original: 0x666666  
                },
                border: {
                    color: 0xffffff,        // Stas original: 0xaaaaaa
                    width: 2.0,             // Stas original: 3
                },
            },
            red: {
                color: {
                    main: 0xB34D50,         // Stas original: 0xfc606f
                    highlight: 0xa06765,    // Stas original: 0x9e4949
                                            // https://fffuel.co/cccolor/ - 0xB34D50 - Tone palette 5
                    contrastText: 0xffffff, // Stas original: 0x666666   
                },
                border: {
                    color: 0xffffff,        // Stas original: 0xaaaaaa
                    width: 2.0,             // Stas original: 3
                },
            },
            gray: {
                color: {
                    main: 0xf5f5f5,         // Stas original: 0xf5faff
                    highlight: 0x949494,    // Stas original: 0x78869e
                                            // https://fffuel.co/cccolor/ - 0xf5f5f5 - Shade palette 4
                    contrastText: 0x666666, // Stas original: 0x666666
                },
                border: {
                    color: 0xaaaaaa,        // Stas original: 0xaaaaaa
                    width: 2.0,             // Stas original: 3
                },
            },
            focus: {
                alpha: 0.6,                 // Stas original: 1.0
                lineWidth: 10,              // Stas original: 5
                offset: 24,                 // Stas original: 11
            },
            highlight: {
                alpha: 0.6,                 // Stas original: 1.0
                lineWidth: 5,               // Stas original: 5
                offset: 13,                 // Stas original: 11
            },
            scale: {
                default: 1.0,               // Stas original: 0.9
                hover: 1.1,                 // Stas original: 1.0
            },
            text: {
                fontFamily: 'Red Hat Mono, "Lucida Console", "Courier"',
                                            // Stas original: '"Lucida Console", "Courier", Red Hat Mono'
                fontWeight: "bold",         // Stas original: "bold"
                multiplier: {
                    size: 0.26,             // Stas original: 0.25
                },
            }
        },

        dag: {
            backgroundColor: 0xeeeeee,      // Stas original: 0xffffff
            headMinRightMargin: 120,
            scaling: {
                referenceBlockSize: 88,
            },
        },

        edge: {
            normal: {
                color: 0xaaaaaa,            // Stas original: 0xaaaaaa
                lineWidth: 2,               // Stas original: 2
                arrowRadius: 5,             // Stas original: 4
            },
            virtualChain: {
                color: 0x85a2c1,            // Stas original: 0xb4cfed
                                            // https://fffuel.co/cccolor/ - 0x5581AA - Tint palette 3
                lineWidth: 5,               // Stas original: 4
                arrowRadius: 7,             // Stas original: 6
            },
            highlighted: {
                parent: {
                    color: 0xaaaaaa,        // Stas original: 0x6be39f
                                            // normal
                    lineWidth: 6,           // Stas original: 4
                    arrowRadius: 8,         // Stas original: 6
                },
                child: {
                    color: 0xaaaaaa,        // Stas original: 0x6be39f
                                            // normal
                    lineWidth: 6,           // Stas original: 4
                    arrowRadius: 8,         // Stas original: 6
                },
                selected: {
                    color: 0x898989,        // Stas original: 0x4de3bb
                                            // https://fffuel.co/pppalette/ - 0xaaaaaa - Shade palette 2
                    lineWidth: 6,           // Stas original: 6
                    arrowRadius: 8,         // Stas original: 8
                },
                virtualChain: {
                    parent: {
                        color: 0x85a2c1,    // Stas original: 0x7ce0e6,
                                            // virtualChain
                        lineWidth: 8,       // Stas original: 6
                        arrowRadius: 8,     // Stas original: 8
                    },
                    child: {
                        color: 0x85a2c1,    // Stas original: 0x7ce0e6,
                                            // virtualChain
                        lineWidth: 8,      // Stas original: 6
                        arrowRadius: 8,     // Stas original: 8
                    },
                },
                markRadius: 6,
                minBorderIncrease: 1.0,
            },
        },

        height: {
            color: {
                main: 0xf7f7f7,             // Stas original: 0xf7f9fa
                                            // NOT USED
                highlight: 0xe3e3e3,        // Stas original: 0xe8e8e8
                contrastText: 0x777777,     // Stas original: 0x777777
            },
            text: {
                fontFamily: '"Verdana", "Arial", "Helvetica", sans-serif',
                                            // Stas original: '"Verdana", "Arial", "Helvetica", sans-serif'
                fontWeight: "normal",       // Stas original: "normal"
                multiplier: {
                    size: 0.185,            // Stas original: 0.15
                    bottomMargin: 0.5,      // Stas original: 0.5
                },
            },
        },

        timeline: {
            maxBlocksPerHeight: 12,         // Stas original: 12
            multiplier: {
                margin: 2.0,                // Stas original: 2.0
            },
            visibleHeightRangePadding: 2,   // Stas original: 2
        },
    },

    scale: (measure: number, blockSize: number): number => {
        return measure * blockSize / theme.components.dag.scaling.referenceBlockSize;
    }
}