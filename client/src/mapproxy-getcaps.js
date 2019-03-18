import {LitElement, html, css} from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js'
import { pathJoin } from './util.js'

import './mp-accordion';

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

/**
* @polymer
* @extends HTMLElement
*/
class MapproxyGetCaps extends LitElement {
    static get properties() {
        return {
            open: {type: Boolean},
            capabilities: {type: Object},
            errorMessage: {type: String},
            createButtonDisabled: {type: Boolean},
            list: {type: Array},
            createResult: {type: String},
            getcapabilitiesResult: {type: String}
        };
    }
    static get styles() {
        return css `
            :host {
                display: block;                
            }
            .panel {
                margin-left: 20px;
            }
            .error {
                color: red;
            }
        `
    }
    constructor() {
        super();
        this.open = false;
        this.capabilities = {};
        this.errorMessage = "";
        this.getcapabilitiesurl = "";
        this.selectedLayers = new Set();
        this.createButtonDisabled = true;
        this.list = [];
        this.createResult = "";
        this.getcapabilitiesResult = "";
    }
    shouldUpdate(changedProperties) {
        if (changedProperties.has('list')) {
            this.updateCreateButton();
        }
        return true;
    }
    render(){
        return html`
            <mp-accordion @click="${e=>this.toggleOpen()}">Get layers from WMS capabilities</mp-accordion>
            <div class="panel">
            ${this.renderGetCapabilitiesForm()}
            ${this.renderErrorMessage()}
            ${this.renderCapabilities()}
            </div>
            `
    }
    toggleOpen(){ 
        this.open = !this.open;
    }
    renderGetCapabilitiesForm() {
        if (!this.open) {
            return html``;
        }
        return html`
            <input type="text" autocomplete="url" id="wmscapabilitiesurl" name="wmscapabilitiesurl" size="128" value="${this.getcapabilitiesurl}" placeholder="HTTP(s) address of WMS service">
            <button @click="${e=>this.fetchCapabilities(e)}">Get</button> ${this.getcapabilitiesResult}
        `;
    }
    renderErrorMessage(){
        if (!this.errorMessage) {
            return html``;
        }
        return html`<div class="error">${this.errorMessage}</div>`
    }
    renderCapabilities()  {
        if (!this.open) {
            return html``;
        }
        if (!this.capabilities.Capability) {
            return html ``;
        }
        return html`
            <div>
            <b>Title</b>: ${this.capabilities.Service.Title}<br>
            <b>Abstract</b>: ${this.capabilities.Service.Abstract}<br>
            <b>Access constraints</b>: ${this.capabilities.Service.AccessConstraints}<br>
            <b>Fees</b>: ${this.capabilities.Service.Fees?this.capabilities.Service.Fees:''}<br>
            <b>Contact information</b><br>
            <b>Primary contact</b>: ${(((this.capabilities.Service.ContactInformation || "").ContactPersonPrimary || "").ContactPerson||"")}<br>
            <b>Primary contact organization</b>: ${(((this.capabilities.Service.ContactInformation || "").ContactPersonPrimary || "").ContactOrganization||"")}<br>
            <b>Contact voice telephone</b>: ${(((this.capabilities.Service.ContactInformation || "").ContactPersonPrimary || "").ContactVoiceTelephone||"")}<br>
            <b>Contact mail</b>: ${(((this.capabilities.Service.ContactInformation || "").ContactPersonPrimary || "").ContactElectronicMailAddress||"")}<br>
            <b>Layers</b><br>
            <input type="checkbox" id="allchecks" @click="${e=>this.toggleAllChecks(e)}" checked><Label for="allchecks">(un-)select all layers</Label><br>
            ${this.renderLayers(this.capabilities.Capability.Layer)}
            <input type="text" @input="${e=>this.checkInput(e)}" id="configname" size="20" value="" placeholder="mapproxy_config_name"> <button ?disabled="${this.createButtonDisabled}" @click="${e=>this.createMapproxyConfig()}">Create</button> ${this.createResult}
            </div>
        `;
    }
    renderLayer(layer) {
        if (layer.Name) {
            return html`<input id="${layer.Name}" type="checkbox" ?checked="${this.selectedLayers.has(layer.Name)}" @change="${e=>this.toggleCheck(layer.Name)}"><label for="${layer.Name}">${layer.Name}</label>, ${layer.Name}${layer.Title?`, ${layer.Title}`:''}`;
        }
        if (layer.Title) {
            return html`${layer.Title}`;
        }
        return html`noname`;
    }
    renderLayers(Layer, depth) {
        if (!Array.isArray(Layer)) {
            Layer = [Layer];
        }
        if (!depth) {
            depth = 0;
        }
        return Layer.map(layer=>html`${unsafeHTML("&nbsp;".repeat(depth))}${this.renderLayer(layer)}<br>${layer.Layer?this.renderLayers(layer.Layer, depth+1):''}`)
    }
    updateCreateButton() {
        if (this.selectedLayers.size === 0) {
            this.createButtonDisabled = true;
        } else {
            const configname = this.shadowRoot.querySelector('#configname').value.trim().toLowerCase();
            this.createButtonDisabled = !(/^[a-z0-9][a-z0-9_-]*$/.test(configname) && this.list.find(item=>item.name.toLowerCase().replace(/\.yaml$/,'')===configname) === undefined)
        }
    }
    checkInput(e) {
        this.updateCreateButton();
    }
    toggleCheck(layername) {
        if (this.selectedLayers.has(layername)) {
            this.selectedLayers.delete(layername);
        } else {
            this.selectedLayers.add(layername);
        }
        this.updateCreateButton();
    }
    toggleAllChecks(e) {
        const checkboxes = Array.from(this.shadowRoot.querySelectorAll('input[type="checkbox"]'));
        checkboxes.forEach(checkbox=>{
            if(checkbox.checked!==e.target.checked) {
                checkbox.checked = e.target.checked;
                this.toggleCheck(checkbox.getAttribute('id'));
            }
        })
    }
    selectAllLayers(Layer) {
        if (!Array.isArray(Layer)) {
            Layer = [Layer];
        }
        Layer.forEach(layer => {
            if (layer.Name) {
                this.selectedLayers.add(layer.Name);
            }
            if (layer.Layer) {
                this.selectAllLayers(layer.Layer);
            }
        });
    }
    fetchCapabilities(e) {
        this.getcapabilitiesResult = 'Fetching...';
        setTimeout(()=>this.getcapabilitiesResult = "", 10000);
        this.capabilities = {};
        this.errorMessage = "";
        this.selectedLayers = new Set();
        this.getcapabilitiesurl = this.shadowRoot.querySelector('input[name="wmscapabilitiesurl"]').value.trim();

        if (this.getcapabilitiesurl !== "") {
            const localConfig = JSON.parse(window.localStorage.config);
            const fetchUrl = `${localConfig.adminserver}getcapabilities?wmsurl=${encodeURIComponent(this.getcapabilitiesurl)}`;
            fetch(fetchUrl)
                .then(response=>{
                    if (!response.ok) {
                        this.getcapabilitiesResult = response.statusText;
                        throw Error(response.statusText)
                    }
                    return response.json();
                })
                .then(json=>{
                    if (!json.Capability) {
                        this.getcapabilitiesResult = "Invalid capabilities";
                        throw Error(JSON.stringify(json));
                    }
                    this.capabilities = json;
                    this.selectAllLayers(this.capabilities.Capability.Layer);
                    this.getcapabilitiesResult = "Done";
                })
                .catch(error=>{
                    this.getcapabilitiesResult = error;
                    this.capabilities = {};
                    this.errorMessage = error;
                })
        }
    }
    getCapabilitiesLayer(Layer, layername) {
        let result = undefined;
        if (!Array.isArray(Layer)) {
            Layer = [Layer];
        }
        // first look for sublayers
        Layer.forEach(layer=>{
            if (!result) {
                if (layer.Layer) {
                    result = this.getCapabilitiesLayer(layer.Layer, layername);
                }
            }
        })
        if (!result) {
            Layer.forEach(layer=>{
                if (!result) {
                    if (layer.Name === layername) {
                        result = layer;
                    }
                }
            })
        }
        return result;
    }
    postMapproxyConfig(adminserver, configname, config) {
        const url = pathJoin([adminserver, "mapproxyupdate", configname+".yaml"]);
        return fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                "Content-Type": "application/json"
            },
            redirect: "follow",
            referrer: "client",
            body: JSON.stringify(config)
        });
    }
    createMapproxyConfig() {
        this.createResult = "Creating...";
        const configname = this.shadowRoot.querySelector('#configname').value.trim().toLowerCase();
        const localConfig = JSON.parse(window.localStorage.config);
        const selectedLayers = Array.from(this.selectedLayers).map(layername=>this.getCapabilitiesLayer(this.capabilities.Capability.Layer, layername));
        const config = {
            "services": {
                "demo":null,
                "tms":null,
                "wmts":null,
                "wms": {
                    "srs":["EPSG:3857", "EPSG:25831","EPSG:25832","EPSG:28992","EPSG:900913"],
                    "image_formats":["image/jpeg","image/png"],
                    "md":{
                        "title": this.capabilities.Service.Title,
                        "abstract": this.capabilities.Service.Abstract,
                        "online_resource": pathJoin([localConfig.metadata.online_resource, configname]),
                        "contact":{
                            "person":localConfig.metadata.contact.person,
                            "position":localConfig.metadata.contact.position,
                            "organization": localConfig.metadata.contact.organization,
                            "postcode": localConfig.metadata.contact.postcode,
                            "email":localConfig.metadata.contact.email,
                            "city": localConfig.metadata.contact.city,
                            "country": localConfig.metadata.contact.country
                        },
                        "access_constraints":localConfig.metadata.access_constraints,
                        "fees":localConfig.metadata.fees
                    }
                }
            },
            "layers":selectedLayers.map(layer=>{
                const result = {
                    name: escape(layer.Name),
                    title: layer.Title,
                    sources: [escape(layer.Name) + "_cache"]
                }
                if (layer.Abstract && layer.Abstract !== "") {
                    result.abstract = layer.Abstract;
                }
                if (layer.ScaleHint && layer.ScaleHint.min) {
                    result.max_res = layer.ScaleHint.min / 1.4142;
                }
                if (layer.ScaleHint && layer.ScaleHint.max) {
                    result.min_res = layer.ScaleHint.max / 1.4142;
                }
                return result;
            }),
            "caches":selectedLayers.reduce((result, layer)=>{
                result[escape(layer.Name) + "_cache"] = {
                    grids: ['spherical_mercator'],
                    sources: [escape(layer.Name) + "_wms"],
                    format: "image/png",
                    disable_storage: false,
                    cache: {
                        type: "sqlite"
                    }
                }
                return result;
            }, {}),
            "sources":selectedLayers.reduce((result, layer)=>{
                result[escape(layer.Name) + "_wms"] = {
                    type: "wms",
                    wms_opts: {
                        featureinfo: layer.queryable,
                        legendgraphic: true
                    },
                    supported_srs: [layerSRS(layer)],
                    req: {
                        url: this.capabilities.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource,
                        layers: layer.Name,
                        transparent: true
                    }
                }
                if (layer.LatLonBoundingBox) {
                    if (layer.LatLonBoundingBox[0] < -180 || layer.LatLonBoundingBox[0] > 180 || layer.LatLonBoundingBox[2] < -180 || layer.LatLonBoundingBox[2] > 180
                        || layer.LatLonBoundingBox[1] < -90 || layer.LatLonBoundingBox[1] > 90 || layer.LatLonBoundingBox[3] < -90 || layer.LatLonBoundingBox[3] > 90) {
                        // invalid latlonbbox
                        // temp: try 28992
                        result[escape(layer.Name) + "_wms"].coverage = {
                            bbox: layer.LatLonBoundingBox,
                            bbox_srs: 'EPSG:28992'
                        }
                    } else {
                        result[escape(layer.Name) + "_wms"].coverage = {
                            bbox: layer.LatLonBoundingBox,
                            bbox_srs: 'EPSG:4326'
                        }
                    }
                }
                return result;
            }, {}),
            "grids":{
                "global_geodetic_sqrt2":{
                    "base":"GLOBAL_GEODETIC",
                    "res_factor":"sqrt2"
                },
                "spherical_mercator":{
                    "base":"GLOBAL_MERCATOR",
                    "tile_size":[256,256],
                    "srs":"EPSG:3857"
                },
                "nltilingschema":{
                    "tile_size":[256,256],
                    "srs":"EPSG:28992",
                    "bbox":[-285401.92,22598.08,595401.92,903401.92],
                    "bbox_srs":"EPSG:28992",
                    "min_res":3440.64,
                    "max_res":0.21,
                    "origin":"sw"
                }
            },
            "globals":{
                "cache":{
                    "meta_buffer":200,
                    "meta_size":[4,4],
                    "base_dir":pathJoin([localConfig.mapproxydir,localConfig.mapproxy_cache,configname])
                },
                "image":{
                    "resampling_method":"bicubic"
                }
            }
        }
        /*this.postMapproxyConfig(localConfig.adminserver, configname, config)
            .then(()=>{
                this.dispatchEvent(new CustomEvent('itemadd', {
                    detail: configname,
                    bubbles: true,
                    composed: true
                }));
            })*/
        this.postMapproxyConfig(localConfig.adminserver, configname, config).then((response) => {
            setTimeout(()=>this.createResult = "", 10000);
            if (!response.ok) {
                this.createResult = response.statusText;
            } else {
                return response.json();
            }}).then(json=> {
                if (json.error) {
                    this.capabilities = json.error;
                } else {
                    this.createResult = "Created!";
                
                    this.dispatchEvent(new CustomEvent('itemadd', {
                        detail: configname,
                        bubbles: true,
                        composed: true
                    }));  
                }
            });
    }
}

window.customElements.define('mapproxy-getcaps', MapproxyGetCaps);

/* polyfill for String.repeat */
if (!String.prototype.repeat) {
    String.prototype.repeat = function(count) {
      'use strict';
      if (this == null) {
        throw new TypeError('can\'t convert ' + this + ' to object');
      }
      var str = '' + this;
      // To convert string to integer.
      count = +count;
      if (count != count) {
        count = 0;
      }
      if (count < 0) {
        throw new RangeError('repeat count must be non-negative');
      }
      if (count == Infinity) {
        throw new RangeError('repeat count must be less than infinity');
      }
      count = Math.floor(count);
      if (str.length == 0 || count == 0) {
        return '';
      }
      // Ensuring count is a 31-bit integer allows us to heavily optimize the
      // main part. But anyway, most current (August 2014) browsers can't handle
      // strings 1 << 28 chars or longer, so:
      if (str.length * count >= 1 << 28) {
        throw new RangeError('repeat count must not overflow maximum string size');
      }
      var maxCount = str.length * count;
      count = Math.floor(Math.log(count) / Math.log(2));
      while (count) {
         str += str;
         count--;
      }
      str += str.substring(0, maxCount - str.length);
      return str;
    }
  }