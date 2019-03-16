function wmsUrl(baseUrl, request)
{
    // build WMS URL from baseURL and request
    const wmsParameters = [
        ["REQUEST", request.toUpperCase()],
        ["SERVICE", "WMS"],
        ["VERSION", "1.1.1"]
    ];
    const wmsRemoveParameters = [];
    switch (request.toUpperCase()) {
        case 'GETCAPABILITIES':
            wmsRemoveParameters.push(...["TRANSPARENT","LAYERS","QUERY_LAYERS","FORMAT","STYLES","SRS","BBOX","WIDTH","HEIGHT"])
            break;
        case 'GETMAP':
            wmsParameters.push(["TRANSPARENT", "TRUE"]);
            wmsParameters.push(["LAYERS", ""]);
            wmsParameters.push(["FORMAT", "image/png"]);
            wmsParameters.push(["STYLES", ""]);
            wmsParameters.push(["SRS", "EPSG:3857"]);
            wmsParameters.push(["BBOX", "{bbox-epsg-3857}"]);
            wmsParameters.push(["WIDTH", "512"]);
            wmsParameters.push(["HEIGHT", "512"]);
            break;
        case 'GETLEGENDGRAPHIC':
            wmsParameters.push(["LAYER", ""]);
            wmsParameters.push(["LAYERS", ""]);
            wmsParameters.push(["FORMAT", "image/png"]);
            wmsParameters.push(["STYLES", ""]);
            wmsRemoveParameters.push(...["BBOX","SRS","QUERY_LAYERS"]);
            break;
        case 'GETFEATUREINFO':
            wmsParameters.push(["LAYERS", ""]);
            wmsParameters.push(["QUERY_LAYERS", ""]);
            wmsParameters.push(["FORMAT", "image/png"]);
            wmsParameters.push(["STYLES", ""]);
            break;
    }
    const urlInfo = new URL(baseUrl);
    const extraParameters = [];
    for (let key of urlInfo.searchParams.keys()) {
        const uCaseKey = key.toUpperCase();
        const index = wmsParameters.findIndex(param=>param[0] === uCaseKey);
        if (index > -1) {
            // known WMS parameter
            if (["VERSION","TRANSPARENT","LAYERS","QUERY_LAYERS","FORMAT","STYLES"].includes(uCaseKey)) {
                // override with value from url
                wmsParameters[index][1] = urlInfo.searchParams.get(key);
            }                
        } else {
            if (!wmsRemoveParameters.includes(uCaseKey)) {
                extraParameters.push([key, urlInfo.searchParams.get(key)]);
            }
        }            
    }
    if (request.toUpperCase() === 'GETFEATUREINFO') {
        const queryLayers = wmsParameters.find(parameter=>parameter[0] === 'QUERY_LAYERS');
        if (queryLayers[1] === "") {
            queryLayers[1] = wmsParameters.find(parameter=>parameter[0] === 'LAYERS')[1];
        }
    }
    if (request.toUpperCase() === 'GETLEGENDGRAPHIC'){
        const legendLayer = wmsParameters.find(parameter=>parameter[0] === 'LAYER');
        if (legendLayer[1] === "") {
            legendLayer[1] = wmsParameters.find(parameter=>parameter[0] === 'LAYERS')[1];
        }
    }
    urlInfo.search = "";
    extraParameters.forEach(parameter=>urlInfo.searchParams.append(parameter[0], parameter[1]));
    wmsParameters.forEach(parameter=>urlInfo.searchParams.append(parameter[0], parameter[1]));
    return urlInfo.toString().replace('BBOX=%7Bbbox-epsg-3857%7D', 'BBOX={bbox-epsg-3857}')        
}

module.exports = wmsUrl;
