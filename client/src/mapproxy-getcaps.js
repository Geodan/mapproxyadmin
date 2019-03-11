import {LitElement, html, css} from 'lit-element';

/**
* @polymer
* @extends HTMLElement
*/
class MapproxyGetCaps extends LitElement {
    static get properties() {
        return {
            open: {type: Boolean}
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
        this.open = false;
    }
    render(){
        return html`
            <button @click="${e=>this.toggleOpen()}">wms capabilities</button> Get layers from WMS capabilities<br>
            ${this.renderGetCapabilitiesForm()}
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
            <input type="text" size="64" value="" placeholder="HTTP(s) address of WMS service"><button>Get</button>
        `;
    }
}

window.customElements.define('mapproxy-getcaps', MapproxyGetCaps);