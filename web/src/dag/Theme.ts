import { TextStyleFontWeight } from "pixi.js-legacy";
import { ThemeType, ThemeTypeConst } from "../model/ThemeType";
import { ThemeOptions } from "@mui/material";

export interface BasePaletteColor {
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
    arrowRadius: number;
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
                minFontSize: number;
                maxFontSize: number;
                maxTextLines: number;
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
                    // horizontal margin between texts expressed in block size multiple
                    marginX: number;
                },
                minFontSize: number;
                maxFontSize: number;
                minBottomMargin: number;
                maxBottomMargin: number;
            }
        },

        timeline: {
            maxBlocksPerHeight: number;
            multiplier: {
                marginX: number;
                minMarginY: number;
            }
            visibleHeightRangePadding: number;
        }
    }

    scale: (measure: number, blockSize: number) => number;

    options: ThemeOptions;  // MUI theme options
};

export const lightTheme: Theme = {
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
                minFontSize: 14,
                maxFontSize: 18,
                maxTextLines: 3,
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
                lineWidth: 7,               // Stas original: 4
                arrowRadius: 9,             // Stas original: 6
            },
            highlighted: {
                parent: {
                    color: 0xaaaaaa,        // Stas original: 0x6be39f
                    // normal
                    lineWidth: 8,           // Stas original: 4
                    arrowRadius: 10,         // Stas original: 6
                },
                child: {
                    color: 0xaaaaaa,        // Stas original: 0x6be39f
                    // normal
                    lineWidth: 8,           // Stas original: 4
                    arrowRadius: 10,         // Stas original: 6
                },
                selected: {
                    color: 0x898989,        // Stas original: 0x4de3bb
                    // https://fffuel.co/pppalette/ - 0xaaaaaa - Shade palette 2
                    lineWidth: 8,           // Stas original: 6
                    arrowRadius: 10,         // Stas original: 8
                },
                virtualChain: {
                    parent: {
                        color: 0x85a2c1,    // Stas original: 0x7ce0e6,
                        // virtualChain
                        lineWidth: 10,       // Stas original: 6
                        arrowRadius: 10,     // Stas original: 8
                    },
                    child: {
                        color: 0x85a2c1,    // Stas original: 0x7ce0e6,
                        // virtualChain
                        lineWidth: 10,      // Stas original: 6
                        arrowRadius: 10,     // Stas original: 8
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
                    size: 0.25,             // Stas original: 0.15
                    bottomMargin: 0.5,      // Stas original: 0.5
                    marginX: 1.25,
                },
                minFontSize: 12,
                maxFontSize: 15,
                minBottomMargin: 10,
                maxBottomMargin: 40,
            },
        },

        timeline: {
            maxBlocksPerHeight: 12,         // Stas original: 12
            multiplier: {
                marginX: 2.0,               // Stas original: 2.0
                minMarginY: 1.0,
            },
            visibleHeightRangePadding: 2,   // Stas original: 2
        },
    },

    scale: (measure: number, blockSize: number): number => {
        return measure * blockSize / theme.components.dag.scaling.referenceBlockSize;
    },

    options: {
        palette: {
            primary: {
                main: "#175676"
            },
            secondary: {
                main: "#26c6da"
            },
            background: {
                paper: "#fff"
            },

            brand: {
                logo: {
                    main: "#71c9bb",
                    contrastText: "#fff",
                },
            },
            block: {
                blue: {
                    main: "#5581AA",
                    dark: "#1f5278", // https://fffuel.co/cccolor/ - #5581AA - Shade palette 4
                    light: "#95adc8" // https://fffuel.co/cccolor/ - #5581AA - Tint palette 4
                },
                red: {
                    main: "#B34D50",
                    dark: "#82212a", // https://fffuel.co/cccolor/ - #B34D50 - Shade palette 4
                    light: "#d48d8b" // https://fffuel.co/cccolor/ - #B34D50 - Tint palette 4
                },
                gray: {
                    main: "#aaaaaa",
                },
            },
            tooltip: {
                background: {
                    main: "#175676"
                },
                border: {
                    main: "#fff"
                },
            }
        },
    }
}

export const darkTheme: Theme = {
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
                    color: 0x2b2b2b,        // Stas original: 0xaaaaaa
                    width: 0.0,             // Stas original: 3
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
                    color: 0x2b2b2b,        // Stas original: 0xaaaaaa
                    width: 0.0,             // Stas original: 3
                },
            },
            gray: {
                color: {
                    main: 0xdcdcdc,         // Stas original: 0xf5faff
                    // https://fffuel.co/cccolor/ - #f5f5f5 - Shade palette 1 - #dcdcdc
                    highlight: 0x949494,    // Stas original: 0x78869e
                    // https://fffuel.co/cccolor/ - #f5f5f5 - Shade palette 4
                    contrastText: 0x666666, // Stas original: 0x666666
                },
                border: {
                    color: 0x2b2b2b,        // Stas original: 0xaaaaaa
                    width: 0.0,             // Stas original: 3
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
                minFontSize: 14,
                maxFontSize: 18,
                maxTextLines: 3,
            }
        },

        dag: {
            backgroundColor: 0x2b2b2b,      // Stas original: 0xffffff
            headMinRightMargin: 120,
            scaling: {
                referenceBlockSize: 88,
            },
        },

        edge: {
            normal: {
                color: 0x787878,            // https://fffuel.co/cccolor/ - #aaaaaa - Shade palette 3 - #787878
                lineWidth: 2,               // Stas original: 2
                arrowRadius: 5,             // Stas original: 4
            },
            virtualChain: {
                color: 0x48759d,            // Stas original: 0xb4cfed
                // https://fffuel.co/cccolor/ - #5581AA - Shade palette 1 - #48759d
                lineWidth: 8,               // Stas original: 4
                arrowRadius: 10,             // Stas original: 6
            },
            highlighted: {
                parent: {
                    color: 0x787878,        // Stas original: 0x6be39f
                    // normal
                    lineWidth: 8,           // Stas original: 4
                    arrowRadius: 10,         // Stas original: 6
                },
                child: {
                    color: 0x787878,        // Stas original: 0x6be39f
                    // normal
                    lineWidth: 8,           // Stas original: 4
                    arrowRadius: 10,         // Stas original: 6
                },
                selected: {
                    color: 0xb3b3b3,        // Stas original: 0x4de3bb
                    // https://fffuel.co/pppalette/ - #787878 - Tint palette 5 - #b3b3b3
                    lineWidth: 8,           // Stas original: 6
                    arrowRadius: 10,         // Stas original: 8
                },
                virtualChain: {
                    parent: {
                        color: 0x48759d,    // Stas original: 0x7ce0e6,
                        // virtualChain
                        lineWidth: 11,       // Stas original: 6
                        arrowRadius: 11,     // Stas original: 8
                    },
                    child: {
                        color: 0x48759d,    // Stas original: 0x7ce0e6,
                        // virtualChain
                        lineWidth: 11,      // Stas original: 6
                        arrowRadius: 11,     // Stas original: 8
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
                highlight: 0x3b3b3b,        // Stas original: 0xe8e8e8
                // https://fffuel.co/cccolor/ - #2b2b2b - Tint palette 1 - #3b3b3b
                contrastText: 0x777777,     // Stas original: 0x777777
            },
            text: {
                fontFamily: '"Verdana", "Arial", "Helvetica", sans-serif',
                // Stas original: '"Verdana", "Arial", "Helvetica", sans-serif'
                fontWeight: "normal",       // Stas original: "normal"
                multiplier: {
                    size: 0.25,             // Stas original: 0.15
                    bottomMargin: 0.5,      // Stas original: 0.5
                    marginX: 1.25,
                },
                minFontSize: 12,
                maxFontSize: 15,
                minBottomMargin: 10,
                maxBottomMargin: 40,
            },
        },

        timeline: {
            maxBlocksPerHeight: 12,         // Stas original: 12
            multiplier: {
                marginX: 2.0,               // Stas original: 2.0
                minMarginY: 1.0,
            },
            visibleHeightRangePadding: 2,   // Stas original: 2
        },
    },

    scale: (measure: number, blockSize: number): number => {
        return measure * blockSize / theme.components.dag.scaling.referenceBlockSize;
    },

    options: {
        palette: {
            mode: 'dark',
            primary: {
                main: "#adc1de" // https://fffuel.co/cccolor/ - #175676 - Cooler palette 7 - #6490c3 - Tint palette 5 - #adc1de
            },
            secondary: {
                main: "#a1e0eb" // https://fffuel.co/cccolor/ - #26c6da - Tint palette 5 
            },
            background: {
                paper: "#3b3b3b" // https://fffuel.co/cccolor/ - #2b2b2b - Tint palette 1 - #3b3b3b
            },

            brand: {
                logo: {
                    main: "#70C7BA",
                    contrastText: "#1a1a1a",
                },
            },
            block: {
                blue: {
                    main: "#5581AA",
                    dark: "#1f5278", // https://fffuel.co/cccolor/ - #5581AA - Shade palette 4
                    light: "#95adc8" // https://fffuel.co/cccolor/ - #5581AA - Tint palette 4
                },
                red: {
                    main: "#B34D50",
                    dark: "#82212a", // https://fffuel.co/cccolor/ - #B34D50 - Shade palette 4
                    light: "#d48d8b" // https://fffuel.co/cccolor/ - #B34D50 - Tint palette 4
                },
                gray: {
                    main: "#aaaaaa",
                },
            },
            tooltip: {
                background: {
                    main: "#3b3b3b"
                },
                border: {
                    main: "#888888"
                },
            }
        },
    }
}

export function setTheme(themeType: ThemeType) {
    switch (themeType) {
        case ThemeTypeConst.LIGHT: {
            theme = lightTheme;
            break;
        }
        case ThemeTypeConst.DARK: {
            theme = darkTheme;
            break;
        }
    }
}

export var theme: Theme = lightTheme;