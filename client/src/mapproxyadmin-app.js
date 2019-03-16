import {LitElement, html, css} from 'lit-element';
import './mapproxy-list';
import './mapproxy-new';
import { pathJoin } from './util.js';

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
    static get styles() {
        return css`
            .config {
                border: 1px solid gray;
                border-radius: 5px;
                margin-bottom: 15px;
                padding: 5px;
            }
            .newconfig {
                background: lightyellow;
            }
            .listconfig {
                background: #e6ffe6;
            }
        `;
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
            return html`client_config.json: ${this.error}`;
        }
        if (this.list && this.list.length && this.list[0].error) {
            this.error = JSON.stringify(this.list[0].error);
        }
        if (this.error) {
            return html`${this.config.adminserver + 'mapproxylist'}: ${this.error}`;
        }
        return html`
        <mapproxy-new class="config newconfig" .config="${this.config}" .list=${this.list} @localConfigUpdate="${e=>this.localConfigUpdate(e)}" @itemadd="${e=>this.addItem(e)}"></mapproxy-new>
        <mapproxy-list class="config listconfig" .config="${this.config}" .list=${this.list} .localConfig="${this.localConfig}" @itemdelete="${e=>this.deleteItem(e)}"></mapproxy-list>
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
        const configName = e.detail;
        const url = pathJoin([this.localConfig.adminserver, 'mapproxydelete', configName]);
        fetch(url).then(response=>{
            if (!response.ok) {
                throw (Error(response.statusText));
            }
            return response.json();            
        }).then(json=>{
            if (json.error) {
                throw (Error(json.error));
            }
            this.list = this.list.filter(item=>item.name!==configName);
        })
    }
    addItem(e) {
        this.fetchList(this.config.adminserver)
                    .then(json=>this.list = json)
                    .catch(error=>this.error = JSON.stringify(error));
    }
    localConfigUpdate() {
        this.localConfig = JSON.parse(window.localStorage.config);
    }
}

window.customElements.define('mapproxyadmin-app', MapproxyAdminApp);