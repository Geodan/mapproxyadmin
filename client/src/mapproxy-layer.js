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
            localConfig: {type: Object}
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
    }
    render(){
        return html`
            <a href="${this.localConfig.metadata.online_resource}/${this.itemname}/demo/?srs=EPSG%3A3857&format=image%2Fpng&wms_layer=${this.layer.name}" target="mapproxypreview">${this.layer.name}</a>
            <button @click="${e=>this.clearCache(this.itemname, this.layer.name)}">clear cache</button>
            `
    }
    clearCache(itemname, layername) {
        const url = pathJoin([this.localConfig.adminserver, 'mapproxyclearcache', itemname + ".yaml", layername]);
        fetch(url).then(response=>{
            if (!response.ok) {
                throw Error(response.statusText);
            }
            return response.json()
        })
        .then(json=>{
            if (json.error) {
                throw Error(json.error);
            }
        })
    }
}

window.customElements.define('mapproxy-layer', MapproxyLayer);