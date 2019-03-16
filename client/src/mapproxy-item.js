import {LitElement, html, css} from 'lit-element';

import './mapproxy-layer';
import './mp-accordion';

/**
* @polymer
* @extends HTMLElement
*/
class MapproxyItem extends LitElement {
    static get properties() {
        return {
            item: {type: Object},
            open: {type: Boolean},
            localConfig: {type: Object}
        };
    }
    static get styles() {
        return css `
            :host {
                display: block;
            }
            .panel {
                margin-left: 20px;
            }
        `
    }
    constructor() {
        super();
        this.item = {};
        this.localConfig = {};
        this.itemname = ""
    }
    shouldUpdate(changedProperties) {
        if (changedProperties.has('item')) {
            this.itemname = this.item.name.replace(/.yaml$/, '');
            this.open = false;
        }
        return true;
    }
    render(){
        if (this.item.name) {
            return html`
                <mp-accordion @click="${(e)=>this.toggleOpen(e)}" .open="${this.open}">${this.item.name}</mp-accordion>
                <div class="panel">
                ${this.renderItem()}
                </div>
                    `;
        }
        return html ``;
    }
    renderItem() {
        if (!this.open) {
            return html ``;
        }
        return html`
            <a href="${this.localConfig.metadata.online_resource}/${this.itemname}/demo" target="mapproxypreview">preview</a> ${this.item.name}
            <button @click="${e=>this.deleteItem(e)}">delete</button><br>
            <b>services</b>: ${Object.keys(this.item.config.services).map(key=>html`${key} `)}<br>
            <b>metadata</b>:<br>${this.htmlTree(this.item.config.services.wms.md)}
            <b>layers</b>:
            <ul>
            ${this.item.config.layers.map(layer=>html`<li><mapproxy-layer .itemname="${this.itemname}" .item="${this.item}" .layer="${layer}" .localConfig="${this.localConfig}"></mapproxy-layer></li>`)}
            </ul>
            `
    }

    toggleOpen(e) {
        this.open = !this.open;
    }
    deleteItem(e) {
        if (confirm('permanently delete: ' + this.item.name + ' from server?')) {
            this.dispatchEvent(new CustomEvent('itemdelete', {
                detail: this.item.name,
                bubbles: true,
                composed: true
            }));
        }
    }
    htmlTree(object) {
        let result = [];
        for (let key in object) {
            result.push(html`<b>${key}</b>: `);
            const value = object[key];
            switch (typeof value) {
                case "string":
                case "number":
                case "undefined":
                case "boolean":
                    result.push(html`${value}<br>`);
                    break;
                case "function":
                    result.push(html`function`);
                    break;
                case "object":
                    if (value === null) {
                        result.push(html`${value}<br>`);
                    } else {
                        result.push(html`<br>${this.htmlTree(object[key])}`);
                    }
                    break;
            }
        }
        return result;
    }
}

window.customElements.define('mapproxy-item', MapproxyItem);