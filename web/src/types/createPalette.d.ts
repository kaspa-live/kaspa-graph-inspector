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
    }

    type BlockColor = BaseBlockColor
}