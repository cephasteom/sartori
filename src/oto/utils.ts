export const formatParamKey = (key: string) =>
    // remove leading underscore
    key.startsWith('_') ? key.slice(1) : key;
