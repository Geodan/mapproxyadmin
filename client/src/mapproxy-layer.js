import {LitElement, html, css} from 'lit-element';
import {pathJoin} from './util.js'

/**
* @polymer
* @extends HTMLElement
*/
class MapproxyLayer extends LitElement {
    static get properties() {
        return {
            itemname: {type: String},
            layer: {type: Object},
            localConfig: {type: Object},
            item: {type: Object},
            cacheResult: {type: String}
        };
    }
    static get styles() {
        return css `
            :host {
                display: block;
            }
        `
    }
    constructor() {
        super();
        this.itemname = "";
        this.layer = {};
        this.item = {};
        this.cacheResult = "";
    }
    render(){
        return html`
            ${this.layer.name}
            <a href="${this.localConfig.metadata.online_resource}/${this.itemname}/demo/?srs=EPSG%3A3857&format=image%2Fpng&wms_layer=${this.layer.name}" target="mapproxypreview">preview</a>
            <button @click="${e=>this.clearCache(this.itemname, this.layer.name)}">clear cache</button>
            ${this.renderResolutions()}
            ${this.renderCoverage()}
            ${this.renderClearCacheResult()}
            `
    }
    renderResolutions() {
        return html 
        `
            ${this.layer.min_res?html`min_res: ${this.layer.min_res}`:''}
            ${this.layer.max_res?html`max_res: ${this.layer.max_res}`:''}
        `
    }
    renderCoverage() {
        const cachename = this.layer.sources[0];
        const sourcename = this.item.config.caches[cachename].sources[0];
        const coverage = this.item.config.sources[sourcename].coverage;
        if (!coverage) {
            return '';
        }
        return html`
            bbox: ${coverage.bbox.join(",")}, srs: ${coverage.bbox_srs}
        `
    }
    renderClearCacheResult() {
        return html`
            ${this.cacheResult}
        `
    }
    resetCacheResult() {
        setTimeout(()=>this.cacheResult = "", 10000);
    }
    clearCache(itemname, layername) {
        this.cacheResult = "clearing cache..."
        const cachename = this.layer.sources[0];
        const url = pathJoin([this.localConfig.adminserver, 'mapproxyclearcache', itemname + ".yaml", cachename]);
        fetch(url).then(response=>{
            if (!response.ok) {
                throw Error(response.statusText);
            }
            this.cacheResult = "cache cleared";
            this.resetCacheResult();
            return response.json()
        })
        .then(json=>{
            if (json.error) {
                if (typeof json.error === 'object') {
                    json.error = JSON.stringify(json.error);
                }
                this.cacheResult = "cache clear, error: " + json.error;
                this.resetCacheResult();
                //throw Error(json.error);
            }
        })
    }
}

window.customElements.define('mapproxy-layer', MapproxyLayer);