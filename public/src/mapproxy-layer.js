import { LitElement, html, css } from "../node_modules/lit-element/lit-element.js";
/**
* @polymer
* @extends HTMLElement
*/

class MapproxyLayer extends LitElement {
  static get properties() {
    return {
      itemname: {
        type: String
      },
      layer: {
        type: Object
      },
      localConfig: {
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
    this.itemname = "";
    this.layer = {};
  }

  render() {
    return html`
            <a href="${this.localConfig.metadata.online_resource}/${this.itemname}/demo/?srs=EPSG%3A3857&format=image%2Fpng&wms_layer=${this.layer.name}" target="mapproxypreview">${this.layer.name}</a> <button>clear cache</button>
            `;
  }

}

window.customElements.define('mapproxy-layer', MapproxyLayer);