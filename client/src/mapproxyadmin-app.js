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
        };
    }
    constructor() {
        super();
        this.config = {};
        this.error = {};
        fetch('./config.json')
            .then(response=>{
                if (response.ok){
                    return response.json()
                } else {
                    return {error: response.statusText}
                }
            })
            .then(json=>{this.config=json});
    }
    render(){
        if (this.config.error) {
            return html`config.json: ${this.config.error}`;
        }
        
        return html`
        <mapproxy-new .config="${this.config}"></mapproxy-new>
        <mapproxy-list .config="${this.config}"></mapproxy-list>
        `;
    }
}

window.customElements.define('mapproxyadmin-app', MapproxyAdminApp);