function chunkSubstr(str: string, size: number) {
    const numChunks = Math.ceil(str.length / size)
    const chunks = new Array(numChunks)

    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
        chunks[i] = str.substr(o, size)
    }

    return chunks
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (value) {
        return JSON.parse(value.toLowerCase().trim()) ?? defaultValue;
    }
    return defaultValue;
}

function parseNumber(value: string | undefined, defaultValue: number): number {
    if (value) {
        return JSON.parse(value.trim()) ?? defaultValue;
    }
    return defaultValue;
}

export {
    chunkSubstr,
    parseBoolean,
    parseNumber,
}