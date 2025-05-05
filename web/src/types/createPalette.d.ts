import '@mui/material/styles/createPalette';
import { BlockColor as BaseBlockColor } from "./Base";

declare module '@mui/material/styles/createPalette' {
    interface PaletteOptions {
        brand: {
            logo?: PaletteColorOptions;
        }

        block: {
            blue?: PaletteColorOptions;
            red?: PaletteColorOptions;
            gray?: PaletteColorOptions;
        }

        tooltip: {
            background?: PaletteColorOptions;
            border?: PaletteColorOptions;
        }
    }

    interface Palette {
        brand: {
            logo: PaletteColor;
        }
        
        block: {
            blue: PaletteColor;
            red: PaletteColor;
            gray: PaletteColor;
        }

        tooltip: {
            background: PaletteColor;
            border: PaletteColor;
        }
    }

    type BlockColor = BaseBlockColor
}