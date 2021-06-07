const resolveAddress = (environmentVariableName: string): string => {
    const address = process.env[environmentVariableName];
    if (!address) {
        throw new Error(`The ${environmentVariableName} environment variable is required`);
    }
    return `${window.location.protocol}//${address}`;
};

const apiAddress = resolveAddress("REACT_APP_API_ADDRESS");
const katnipAddress = resolveAddress("REACT_APP_KATNIP_ADDRESS");
const kaspaLiveAddress = resolveAddress("REACT_APP_KASPA_LIVE_ADDRESS");

export {
    apiAddress,
    katnipAddress,
    kaspaLiveAddress,
};
