import {LitElement, html} from 'lit-element';
import './mapproxy-item';

/**
* @polymer
* @extends HTMLElement
*/
class MapproxyList extends LitElement {
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
        this.error = "";
    }
    shouldUpdate(changedProperties) {
        if (changedProperties.has('config')) {
            if (this.config.adminserver) {
                fetch(this.config.adminserver + 'mapproxylist')
                .then(response=>{
                    if (!response.ok) {
                        throw Error(response.statusText);
                    }
                    return response.json()
                })
                .then(json=>{
                    this.list = json;
                })
                .catch(error=>{
                    this.error = error;
                });
            }
        }
        if (changedProperties.has('list')) {
            console.log('list changed');
        }
        return true;
    }
    render(){
        if (this.error !== "") {
            return html`${this.config.adminserver + 'mapproxylist'}: ${this.error}`;
        }
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