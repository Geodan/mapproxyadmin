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
            open: {type: Boolean}
        };
    }
    constructor() {
        super();
        this.config = {};
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
            <mapproxy-item .item="${item}" @itemdelete="${e=>this.deleteItem(e)}"></mapproxy-item><br>`)}`;
    }
    deleteItem(e) {
        this.list = this.list.filter(item=>item.name!==e.detail);
    }
    toggleOpen(e) {
        this.open = !this.open;
    }
}

window.customElements.define('mapproxy-list', MapproxyList);