import {LitElement, html} from 'lit-element';
import './mapproxy-list';
import './mapproxy-new';

/**
* @polymer
* @extends HTMLElement
*/
class MapproxyAdminApp extends LitElement {
    static get properties() {
        return {
            config: {type: Object},
            localConfig: {type: Object},
            list: {type: Array}
        };
    }
    constructor() {
        super();
        this.config = {};
        this.error = undefined;
        this.list = [];
        fetch('./config.json')
            .then(response=>{
                if (response.ok){
                    return response.json()
                } else {
                    return {error: response.statusText}
                }
            })
            .then(json=>{
                this.config = json;
                if (!window.localStorage.config) {
                    window.localStorage.config = JSON.stringify(json);
                }
                this.localConfig = JSON.parse(window.localStorage.config);
                this.fetchList(this.config.adminserver)
                    .then(json=>this.list = json)
                    .catch(error=>this.error = JSON.stringify(error));
            });
    }
    render(){
        if (this.config.error) {
            return html`config.json: ${this.error}`;
        }
        if (this.error) {
            return html`${this.config.adminserver + 'mapproxylist'}: ${this.error}`;
        }
        return html`
        <mapproxy-new .config="${this.config}" .list=${this.list} @localConfigUpdate="${e=>this.localConfigUpdate(e)}"></mapproxy-new>
        <mapproxy-list .config="${this.config}" .list=${this.list} .localConfig="${this.localConfig}" @itemdelete="${e=>this.deleteItem(e)}"></mapproxy-list>
        `;
    }
    fetchList(adminserver) {
        return fetch(adminserver + 'mapproxylist')
            .then(response=>{
                if (!response.ok) {
                    throw Error(response.statusText);
                }
                return response.json()
            })
    }
    deleteItem(e) {
        this.list = this.list.filter(item=>item.name!==e.detail);
    }
    localConfigUpdate() {
        this.localConfig = JSON.parse(window.localStorage.config);
    }
}

window.customElements.define('mapproxyadmin-app', MapproxyAdminApp);