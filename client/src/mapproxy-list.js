import {LitElement, html} from 'lit-element';

/**
* @polymer
* @extends HTMLElement
*/
class MapproxyList extends LitElement {
    static get properties() {
        return {
            config: {type: Object}, 
            list: {type: Array}
        };
    }
    constructor() {
        super();
        this.config = {};
        this.list = [];
    }
    shouldUpdate(changedProperties) {
        if (changedProperties.has('config')) {
            if (this.config.adminserver) {
                fetch(this.config.adminserver + 'mapproxylist')
                .then(response=>response.json())
                .then(json=>{
                    this.list = json;
                    //this.requestUpdate();
                });
            }
        }
        if (changedProperties.has('list')) {
            console.log('list changed');
        }
        return true;
    }
    render(){
        return html`${this.list.map(item=>html`${item.name}<br>`)}`;
    }
}

window.customElements.define('mapproxy-list', MapproxyList);