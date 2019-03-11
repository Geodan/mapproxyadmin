import { LitElement, html, css } from "../node_modules/lit-element/lit-element.js";
import "./mapproxy-layer.js";
/**
* @polymer
* @extends HTMLElement
*/

class MapproxyItem extends LitElement {
  static get properties() {
    return {
      item: {
        type: Object
      },
      open: {
        type: Boolean
      }
    };
  }

  static get styles() {
    return css`
            :host {
                display: block;                
            }
            .iteminfo {
                margin-left: 10px;
            }
        `;
  }

  constructor() {
    super();
    this.item = {};
    this.itemname = "";
  }

  shouldUpdate(changedProperties) {
    if (changedProperties.has('item')) {
      this.itemname = this.item.name.replace(/.yaml$/, '');
    }

    return true;
  }

  render() {
    if (this.item.name) {
      return html`
                ${this.itemname}
                <button @click="${e => this.toggleOpen(e)}">${this.open ? 'close' : 'open'}</button>
                <button @click="${e => this.deleteItem(e)}">delete</button>
                ${this.open ? html`<div class="iteminfo">
                    <b>services</b>: ${Object.keys(this.item.config.services).map(key => html`${key} `)}<br>
                    <b>metadata</b>:<br>${this.htmlTree(this.item.config.services.wms.md)}
                    <b>layers</b>:<br>${this.item.config.layers.map(layer => html`<mapproxy-layer .itemname="${this.item.name}" .layer="${layer}"></mapproxy-layer>`)}
                    </div>
                    ` : ''}
                `;
    }

    return html``;
  }

  toggleOpen(e) {
    this.open = !this.open;
  }

  deleteItem(e) {
    if (confirm('permanently delete: ' + this.item.name + '?')) {
      this.dispatchEvent(new CustomEvent('itemdelete', {
        detail: this.item.name
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