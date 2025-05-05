import { ThemeType as BaseThemeType } from "../types/Base";

export type ThemeType = BaseThemeType;

interface ThemeTypeConstDefinition {
    LIGHT: ThemeType;
    DARK: ThemeType;
}

export const ThemeTypeConst: ThemeTypeConstDefinition = {
    LIGHT: "light",
    DARK: "dark",
};

export function parseThemeType(value: string | undefined, defaultValue: ThemeType): ThemeType {
    if (value) {
        let v = value.toLowerCase().trim();
        switch (v) {
            case ThemeTypeConst.LIGHT:
            case ThemeTypeConst.DARK: {
                return v;
            }
        }
    }
    return defaultValue;
}