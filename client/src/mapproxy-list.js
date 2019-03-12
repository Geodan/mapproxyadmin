import {LitElement, html} from 'lit-element';
import './mapproxy-item';

/**
* @polymer
* @extends HTMLElement
*/
export class MapproxyList extends LitElement {
    static get properties() {
        return {
            config: {type: Object}, 
            list: {type: Array},
            error: {type: String},
            open: {type: Boolean},
            localConfig: {type: Object}
        };
    }
    constructor() {
        super();
        this.config = {};
        this.localConfig = {};
        this.list = [];
    }
    render(){
        return html`<button @click="${e=>this.toggleOpen(e)}">List mapproxy configs...</button><br>
        ${this.renderList()}`
    }
    renderList() {
        if (!this.open) {
            return html``;
        }
        return html`${this.list.map(item=>html`
            <mapproxy-item .item="${item}" .localConfig="${this.localConfig}"></mapproxy-item><br>`)}`;
    }
    toggleOpen(e) {
        this.open = !this.open;
    }
}

window.customElements.define('mapproxy-list', MapproxyList);