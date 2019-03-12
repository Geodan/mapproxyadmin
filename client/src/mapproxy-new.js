import {LitElement, html, css} from 'lit-element';

import './mapproxy-config';
import './mapproxy-getcaps';

/**
* @polymer
* @extends HTMLElement
*/
class MapproxyNew extends LitElement {
    static get properties() {
        return {
            config: {type: Object},
            open: {type: Boolean},
            list: {type: Array}
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
        this.config = {};
        this.open = false;
    }
    render(){
        return html`
            <button @click="${e=>this.toggleOpen(e)}">New mapproxy config...</button><br>
            ${this.mapproxyNewForm()}
            `
    }
    mapproxyNewForm() {
        if (!this.open) {
            return html``;
        }
        return html`
            <mapproxy-config .config="${this.config}"></mapproxy-config>
            <mapproxy-getcaps .list="${this.list}"></mapproxy-getcaps>
            `
    }
    toggleOpen(e) {
        this.open = !this.open;
    }
}

window.customElements.define('mapproxy-new', MapproxyNew);