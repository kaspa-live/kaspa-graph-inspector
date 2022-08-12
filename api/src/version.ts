import fs from "fs";

const getPackageVersion = (): string => {
    const packagejson:any = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    return packagejson.version;
};

const packageVersion = getPackageVersion();

export {
    packageVersion
};