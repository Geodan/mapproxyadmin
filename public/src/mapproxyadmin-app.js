import { LitElement, html } from "../node_modules/lit-element/lit-element.js";
import "./mapproxy-list.js";
/**
* @polymer
* @extends HTMLElement
*/

class MapproxyAdminApp extends LitElement {
  static get properties() {
    return {
      config: {
        type: Object
      }
    };
  }

  constructor() {
    super();
    this.config = {};
    fetch('./config.json').then(response => response.json()).then(json => {
      this.config = json;
    });
  }

  render() {
    return html`<a href="config.html">Configuration</a><br>
        <mapproxy-list .config="${this.config}"></mapproxy-list>
        `;
  }

}

window.customElements.define('mapproxyadmin-app', MapproxyAdminApp);