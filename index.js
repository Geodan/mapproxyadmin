
const createWmsUrl = require('./wmsurl.js');
//const DOMParser = global.DOMParser = require('xmldom').DOMParser;
//cp iconst window = global;
//const WMSCapabilities =  require('wms-capabilities');
const WMSCapabilities = require('wms-capabilities');
const DOMParser = require('xmldom').DOMParser;
const express = require('express');
const app = express();
const axios = require('axios');
const fs = require('fs');
const fsPromises = fs.promises;
const jsyaml = require('js-yaml');
const sanitize = require('sanitize-filename');
const config = require('./public/config.json');
const cors =require('cors');

const port = 8083;

app.use(express.static('public'));
app.use(express.json({limit:'5mb'}));
app.use(cors());

app.get('/mapproxylist', (req, res) => {
    fsPromises.readdir(config.mapproxydir + '/projects/', {withFileTypes:true}).then(dir=>{
        const filenames = dir.filter(dirent=>dirent.isFile()&&(dirent.name.endsWith('.yaml')||dirent.name.endsWith('.yml'))).map(dirent=>dirent.name);
        Promise.all(filenames.map(filename=>readYaml(filename))).then(values=>res.json(values));
    }).catch(error=>{
        res.json([{error: error}])
    })
})

app.get('/mapproxyread/:mpconfig', (req, res) => {
    const mpconfig = sanitize(req.params.mpconfig);
    readYaml(mpconfig).then(json=>{
        res.json(json);
    });
})

app.post('/mapproxyupdate/:mpconfig', (req, res) => {
    const mpconfig = sanitize(req.params.mpconfig);
    const yaml = jsyaml.safeDump(req.body, {styles: {'!!null': ''}});
    fsPromises.writeFile(config.mapproxydir + 'projects/' + mpconfig, yaml)
        .then(()=>res.json({name: mpconfig, result: "saved"}))
        .catch((error)=>res.json({name: mpconfig, error: error}));
})

function trashFile(name, number) {
    const trashedPath = config.mapproxydir + 'projects/trash/' + name + (number?number:'');
    return fsPromises.stat(trashedPath).then((stat)=>{
        return false; /* file exists */
    }).catch(err=>{
        if (err.code == 'ENOENT') {
            /* file does not exist */
            return fsPromises.rename(config.mapproxydir + 'projects/' + name, trashedPath)
            .then(()=>{
                return true;
            })
            .catch(err=>{
                console.log(err);
                return false;
            })
        } else {
            console.log(err);
            return false;
        }
    });
}

app.get('/mapproxydelete/:mpconfig', (req, res) => {
    const mpconfig = sanitize(req.params.mpconfig);
    if (!fs.existsSync(config.mapproxydir + 'projects/' + mpconfig)) {
        res.json({name: mpconfig, result: 'file does not exist'});
        return;
    }
    fsPromises.mkdir(config.mapproxydir + 'projects/trash')
        .catch(err=>{if (err.code !== 'EEXIST') {console.log(err)}})
        .finally(async ()=>{
            console.log('start trashing file');
            for (let i = 0; i < 300; i++) {
                let result = await trashFile(mpconfig, i);
                if (result) {
                    res.json({name: mpconfig, result: 'ok'})
                    return;
                }
            }
            res.json({name: mpconfig, result: 'move to trash failed, need to empty trash?'})
        })
})

app.get('/mapproxyclearcache/:mpconfig/:cachename', (req, res) => {
    const mpconfig = sanitize(req.params.mpconfig);
    const cachename = sanitize(req.params.cachename);
    getCachePaths(mpconfig, cachename).then(result=>{
        if (result.error) {
            res.json(result);
        } else {
            const caches = result.result;
            res.json({name: mpconfig, result: caches});
        }
    }).catch(err=>{
        res.json({name:mpconfig, error: err});
    })
});

function getCachePaths(mpconfig, cachename) {
    return readYaml(mpconfig).then(json=>{
        if (json.error) {
            return json;
        }
        if (!json.config.caches.hasOwnProperty(cachename)) {
            return {name: mpconfig, error: `${cachename} not in ${mpconfig}`}
        }
        if (json.config.caches[cachename].disable_storage) {
            return {name: mpconfig, error: "storage for this cache is disabled"}
        }
        let cacheType = 'file';
        if (json.config.caches[cachename].cache && json.config.caches[cachename].cache.type) {
            const supportedTypes = ['file', 'sqlite']
            cacheType = json.config.caches[cachename].cache.type;
            if (!supportedTypes.includes(cacheType)) {
                return {name: mpconfig, error: `only caches of type ${supportedTypes.join(',')} supported`}
            }
        }
        let appendToCacheName = (cacheType === 'file');
        let grids = json.config.caches[cachename].grids;
        let base_dir = config.mapproxydir + 'mp';
        if (json.config.globals 
                && json.config.globals.cache 
                && json.config.globals.cache.base_dir) {
            base_dir = json.config.globals.cache.base_dir;
        }
        if (json.config.caches[cachename].base_dir) {
            base_dir = json.config.caches[cachename].base_dir;
        }
        if (json.config.caches[cachename].cache.directory) {
            base_dir = json.config.caches[cachename].cache.directory;
            appendToCacheName = false;
        }
        if (!base_dir.startsWith(config.mapproxydir)) {
            return {name: mpconfig, error: `${base_dir} is outside ${config.mapproxydir}`}
        }
        return fsPromises.readdir(base_dir, {withFileTypes:true})
            .then(dir=>{
                const caches = dir.filter(dirent=>dirent.isDirectory() && dirent.name.startsWith(cachename))
                    .filter(dirent=>{
                        if (!appendToCacheName) {
                            return dirent.name === cachename;
                        }
                        const extra = dirent.name.substr(cachename.length);
                        if (!extra.startsWith('_')){
                            return false;
                        }
                        if (/^_EPSG[0-9]+$/.test(extra)) {
                            return true;
                        }
                        if (grids && grids.length) {
                            return grids.includes(extra.substr(1));
                        }
                        console.log(extra);
                        return false;
                    })
                    .map(dirent=>base_dir + '/' + dirent.name);
                return {name: mpconfig, result: caches}
            })
            .catch(err=>{
                return {name: mpconfig, error: err}
            })
    });
}

function readYaml(mpconfig) {
    return fsPromises.readFile(config.mapproxydir + 'projects/' + mpconfig).then(data=>{
        return {name: mpconfig, config: jsyaml.safeLoad(data)};
    }).catch(error=>{
        if (error.code === 'ENOENT') {
            return {name: mpconfig, error: 'not found'}
        }
        return {name: mpconfig, error: error};
    });
}

async function getcapabilities(wmsUrl) {
    const response = await axios.get(wmsUrl);       
    if (response.status >= 200 && response.status < 300) {
        const contentType = response.headers['content-type'];
        if (contentType && (contentType.startsWith('application/vnd.ogc.wms_xml') || contentType.startsWith('text/xml') || contentType.startsWith('application/xml'))) {
            const json = new WMSCapabilities(response.data, DOMParser).toJSON();
            if (!json.Capability) {
                // invalid wms-capabilities
                json.data = response.data;
            }
            json.wmsurl = wmsUrl;
            return json;
        } else {
            return {'Error': `GetCapababilities content-type should be either xml or vnd.ogc.wms_xml, but ${contentType} returned`, wmsurl: wmsUrl}
        }
    } else {
        return {'Error': `status ${response.status}, ${response.statusText}`, wmsurl: wmsUrl};
    }
}

app.get('/getcapabilities', (req, res) => {
    if (!req.query.wmsurl) {
        return res.json({'Error': 'missing wmsurl parameter'});
    }
    const wmsUrl = createWmsUrl(req.query.wmsurl, 'getcapabilities');
    getcapabilities(wmsUrl)
        .then(json=>{
            res.json(json);
        })
        .catch(error=>{
            res.json({'Error': `${error}`});
        });
});

if (!config.mapproxydir.endsWith('/')) {
    config.mapproxydir += '/';
}
if (!config.metadata.online_resource.endsWith('/')) {
    config.metadata.online_resource += '/';
}


function quote(str) {
    return str.replace(/'/g,"''").replace(/[\r\n]+/g,"\\n");
}

function escape(name) {
    return quote(name.replace(/ /g, '_').replace(/:/g, '_'))
}

function layerSRS(layer) {
    let srs = layer.SRS.find(srs=>srs==='EPSG:3857');
    if (!srs) {
        // find first projected SRS
        srs = layer.SRS.find(srs=>srs !== 'CRS:84' && srs !== 'EPSG:4326');
    }
    if (!srs) {
        srs = layer.SRS.find(srs=>srs==='EPSG:4326');
    }
    if (!srs) {
        srs = layer.SRS.length ? layer.SRS[0] : 'EPSG:3857';
    }
    return srs;
}

function isValidProxyLayer(layer) {
    if (!layer.Name) {
        return false;
    }
    if (layer.LatLonBoundingBox) {
        if (layer.LatLonBoundingBox[0] < -180 || 
            layer.LatLonBoundingBox[0] > 180 ||
            layer.LatLonBoundingBox[2] < -180 || 
            layer.LatLonBoundingBox[2] > 180 ||
            layer.LatLonBoundingBox[1] < -90 ||
            layer.LatLonBoundingBox[1] > 90 ||
            layer.LatLonBoundingBox[1] < -90 ||
            layer.LatLonBoundingBox[1] > 90) {
                console.log(`Layer ${layer.Name}: Invalid boundingbox: ${layer.LatLonBoundingBox.join(',')}`);
                return false;
        }
    }
    return true;
}

function proxyLayer(layer) {
    let result = '';
    if (isValidProxyLayer(layer)) {
        result = `
  - name: '${escape(layer.Name)}'
    title: '${quote(layer.Title)}'
    abstract: '${quote(layer.Abstract?layer.Abstract:layer.Title)}'
    sources: [${escape(layer.Name) + '_cache'}]
    ${layer.ScaleHint?`
    max_res: ${layer.ScaleHint.min / 1.4142}
    min_res: ${layer.ScaleHint.max / 1.4142}
    `:''}`;          
    }
    if (layer.Layer) {
        result += layer.Layer.map(layer=>proxyLayer(layer)).join('');
    }
    return result;
}
function cacheLayer(layer) {
    let result = '';
    if (isValidProxyLayer(layer)) {
        result = `
    ${escape(layer.Name) + '_cache'}:
      grids: [spherical_mercator]
      sources: [${escape(layer.Name) + '_wms'}]
      format: image/png
      disable_storage: true`    
    }
    if (layer.Layer) {
        result += layer.Layer.map(layer=>cacheLayer(layer)).join('');
    }
    return result;
}

function sourceLayer(layer, wmsServiceUrl) {
    let result = '';
    if (isValidProxyLayer(layer)) {
        const srs = layerSRS(layer);
        result = `
    ${escape(layer.Name) + '_wms'}:
      type: wms
      wms_opts:
        featureinfo: ${layer.queryable?'true':'false'}
        legendgraphic: true
      supported_srs: ['${srs}']
      req:
        url: '${wmsServiceUrl}'
        layers: '${layer.Name}'
        transparent: true
      coverage:
        bbox: [${layer.LatLonBoundingBox.join(',')}]
        bbox_srs: 'EPSG:4326'`
    }
    if (layer.Layer) {
        result += layer.Layer.map(layer=>sourceLayer(layer, wmsServiceUrl)).join('');
    }
    return result;
}

function getWmsServiceName(capabilities)
{
    if (capabilities.Capability.Layer.Name && capabilities.Capability.Layer.Name !== '') {
        return escape(capabilities.Capability.Layer.Name);
    }
    if (capabilities.Capability.Layer.Title && capabilities.Capability.Title !== '') {
        return escape(capabilities.Capability.Layer.Title);
    }
    return 'Noname'
}

app.get('/tempproxy', async (req, res)=> {
    const wmsUrl = createWmsUrl(req.query.wmsurl, 'getcapabilities');
    const capabilities = await getcapabilities(wmsUrl);
    const wmsServiceUrl = capabilities.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource;
    const wmsServiceName = getWmsServiceName(capabilities);
    const yml = `
services:
  demo:
  tms:
  wmts:
  wms:
    srs: ['EPSG:3857']
    image_formats: ['image/jpeg', 'image/png']
    md:
      # metadata used in capabilities documents
      title: '${req.query.servicetitle}'
      abstract: '${req.query.serviceabstract}'
      onlineresource: ${config.metadata.online_resource + 'tempproxy'}
      contact:
         person: ${req.query.contactpersonprimary}
         position: Contactpunt
         email: ${req.query.contactmail}
      access_constraints: ${req.query.serviceaccessconstraints}
      fees: ${req.query.servicefees}
layers:
${proxyLayer(capabilities.Capability.Layer)}
caches:
${cacheLayer(capabilities.Capability.Layer)}
sources:
${sourceLayer(capabilities.Capability.Layer, wmsServiceUrl)}
grids:
  global_geodetic_sqrt2:
    base: GLOBAL_GEODETIC
    res_factor: 'sqrt2'
  spherical_mercator:
    base: GLOBAL_MERCATOR
    tile_size: [256, 256]
    srs: 'EPSG:3857'
    #res_factor: 'sqrt2'
  nltilingschema:
    tile_size: [256, 256]
    srs: 'EPSG:28992'
    bbox: [-285401.920, 22598.080, 595401.920, 903401.920]
    bbox_srs: 'EPSG:28992'
    min_res: 3440.64
    max_res: 0.21
    origin: sw

globals:
  # # coordinate transformation options
  # srs:
  #   # WMS 1.3.0 requires all coordiates in the correct axis order,
  #   # i.e. lon/lat or lat/lon. Use the following settings to
  #   # explicitly set a CRS to either North/East or East/North
  #   # ordering.
  #   axis_order_ne: ['EPSG:9999', 'EPSG:9998']
  #   axis_order_en: ['EPSG:0000', 'EPSG:0001']
  #   # you can set the proj4 data dir here, if you need custom
  #   # epsg definitions. the path must contain a file named 'epsg'
  #   # the format of the file is:
  #   # <4326> +proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs  <>
  #   proj_data_dir: '/path to dir that contains epsg file'

  # # cache options
  cache:
    # where to store the cached images
    base_dir: '${config.mapproxydir}mp/${wmsServiceName}'
    # where to store lockfiles
    lock_dir: '${config.mapproxydir}mplocks'
    meta_size: [4, 4]
    meta_buffer: 100
  #   # request x*y tiles in one step
  #   meta_size: [4, 4]
  #   # add a buffer on all sides (in pixel) when requesting
  #   # new images

  # image/transformation options
  image:
      #resampling_method: nearest
      # resampling_method: bilinear
      resampling_method: bicubic
  #   formats:
  #     image/png:
  #        encoding_options:
  #          quantizer: fastoctree
  #     jpeg_quality: 90
  #     # stretch cached images by this factor before
  #     # using the next level
  #     # stretch_factor: 1.15
  #    stretch_factor: 1.3
  #     # shrink cached images up to this factor before
  #     # returning an empty image (for the first level)
  #     max_shrink_factor: 4.0
`;
    res.json({"result": yml, "caps": capabilities});
    const f = fs.openSync(config.mapproxydir + 'projects/tempproxy.yaml', 'w');
    fs.writeFileSync(f, yml);
    fs.closeSync(f);
})



app.listen(port, () => console.log(`Mapproxy Admin API listening on port ${port}`));
