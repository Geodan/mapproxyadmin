import { LitElement, html, css } from "../node_modules/lit-element/lit-element.js";
/**
* @polymer
* @extends HTMLElement
*/

class MapproxyLayer extends LitElement {
  static get properties() {
    return {
      item: {
        type: Object
      },
      layer: {
        type: Object
      }
    };
  }

  static get styles() {
    return css`
            :host {
                display: block;                
            }
        `;
  }

  constructor() {
    super();
    this.item = {};
    this.layer = {};
  }

  render() {
    return html`
            ${this.layer.name} <button>clear cache</button>
            `;
  }

}

window.customElements.define('mapproxy-layer', MapproxyLayer);