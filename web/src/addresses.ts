// Environment variables are used for configuring the application.
// They define the adresses of the 3 components that are targets of queries.
// A variable must contain a host and optionnaly a port and/or a protocol.

const resolveAddress = (environmentVariableName: string): string => {
    const address = process.env[environmentVariableName];
    if (!address) {
        throw new Error(`The ${environmentVariableName} environment variable is required`);
    }
    const prefix = address.includes("//") ? "" : `${window.location.protocol}//`;
    return `${prefix}${address}`;
};

const apiAddress = resolveAddress("REACT_APP_API_ADDRESS");
const katnipAddress = resolveAddress("REACT_APP_KATNIP_ADDRESS");
const kaspaLiveAddress = resolveAddress("REACT_APP_KASPA_LIVE_ADDRESS");

export {
    apiAddress,
    katnipAddress,
    kaspaLiveAddress,
};
