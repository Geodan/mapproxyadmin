import {LitElement, html, css} from 'lit-element';
import './mapproxy-item';
import './mp-accordion';

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
    static get styles() {
        return css`
            :host {display: block;}
            .panel {margin-left: 20px;}
        `
    }
    constructor() {
        super();
        this.config = {};
        this.localConfig = {};
        this.list = [];
    }
    render(){
        return html`<mp-accordion @click="${e=>this.toggleOpen(e)}">List mapproxy configs...</mp-accordion>
        <div class="panel">
        ${this.renderList()}
        </div>`
    }
    renderList() {
        if (!this.open) {
            return html``;
        }
        return html`${this.list.map(item=>html`
            <mapproxy-item .item="${item}" .localConfig="${this.localConfig}"></mapproxy-item>`)}`;
    }
    toggleOpen(e) {
        this.open = !this.open;
    }
}

window.customElements.define('mapproxy-list', MapproxyList);