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
};

export const theme: Theme = {
    components: {
        block: {
            roundingRadius: 10,             // Stas original: 10
            blue: {
                color: {
                    main: 0x4B81BD,         // Stas original: 0xb4cfed,
                    highlight: 0x7196c9,    // Stas original: 0x49849e
                                            // https://fffuel.co/cccolor/ - 0x4B81BD - Tint palette 2
                    contrastText: 0xffffff, // Stas original: 0x666666  
                },
                border: {
                    color: 0xffffff,        // Stas original: 0xaaaaaa
                    width: 3.0,             // Stas original: 3
                },
            },
            red: {
                color: {
                    main: 0xfc606f,         // Stas original: 0xfc606f
                    highlight: 0x9e4949,    // Stas original: 0x9e4949
                    contrastText: 0xffffff, // Stas original: 0x666666   
                },
                border: {
                    color: 0xffffff,        // Stas original: 0xaaaaaa
                    width: 3.0,             // Stas original: 3
                },
            },
            gray: {
                color: {
                    main: 0xf5faff,         // Stas original: 0xf5faff
                    highlight: 0x78869e,    // Stas original: 0x78869e
                    contrastText: 0x666666, // Stas original: 0x666666
                },
                border: {
                    color: 0xaaaaaa,        // Stas original: 0xaaaaaa
                    width: 3.0,             // Stas original: 3
                },
            },
            focus: {
                lineWidth: 8,               // Stas original: 5
                offset: 15,                 // Stas original: 11
            },
            highlight: {
                lineWidth: 5,               // Stas original: 5
                offset: 11,                 // Stas original: 11
            },
            scale: {
                default: 0.9,               // Stas original: 0.9
                hover: 1.0,                 // Stas original: 1.0
            },
            text: {
                fontFamily: 'monospace, "Lucida Console", "Courier"',
                                            // Stas original: '"Lucida Console", "Courier", monospace'
                fontWeight: "bold",         // Stas original: "bold"
                multiplier: {
                    size: 0.25,             // Stas original: 0.25
                },
            }
        },

        dag: {
            backgroundColor: 0xeeeeee,      // Stas original: 0xffffff
        },

        edge: {
            normal: {
                color: 0xaaaaaa,            // Stas original: 0xaaaaaa
                lineWidth: 2,               // Stas original: 2
                arrowRadius: 4,             // Stas original: 4
            },
            virtualChain: {
                color: 0x82a2cf,            // Stas original: 0xb4cfed
                                            // https://fffuel.co/cccolor/ - 0x4B81BD - Tint palette 3
                lineWidth: 5,               // Stas original: 4
                arrowRadius: 7,             // Stas original: 6
            },
            highlighted: {
                parent: {
                    color: 0x6be39f,        // Stas original: 0x6be39f
                    lineWidth: 4,           // Stas original: 4
                    arrowRadius: 6,         // Stas original: 6
                },
                child: {
                    color: 0x6be39f,        // Stas original: 0x6be39f
                    lineWidth: 4,           // Stas original: 4
                    arrowRadius: 6,         // Stas original: 6
                },
                selected: {
                    color: 0x4de3bb,        // Stas original: 0x4de3bb
                    lineWidth: 6,           // Stas original: 6
                    arrowRadius: 8,         // Stas original: 8
                },
                virtualChain: {
                    parent: {
                        color: 0x195d96,    // Stas original: 0x7ce0e6,
                                            // https://fffuel.co/cccolor/ - 0x4B81BD - Shade palette 3
                        lineWidth: 6,       // Stas original: 6
                        arrowRadius: 8,     // Stas original: 8
                    },
                    child: {
                        color: 0x195d96,    // Stas original: 0x7ce0e6,
                                            // https://fffuel.co/cccolor/ - 0x4B81BD - Shade palette 3
                        lineWidth: 6,       // Stas original: 6
                        arrowRadius: 8,     // Stas original: 8
                    },
                },
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
                    size: 0.15,             // Stas original: 0.15
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
}