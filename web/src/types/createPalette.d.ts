import '@mui/material/styles/createPalette';

declare module '@mui/material/styles/createPalette' {
    interface PaletteOptions {    
        blueBlock?: PaletteColorOptions;
        redBlock?: PaletteColorOptions;
        newBlock?: PaletteColorOptions;
    }

    interface Palette {
        blueBlock: PaletteColor;
        redBlock: PaletteColor;
        newBlock: PaletteColor;
    }

    type BlockColor = "blueBlock" | "redBlock" | "newBlock" | undefined
}