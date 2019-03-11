import { LitElement, html } from "../node_modules/lit-element/lit-element.js";
import "./mapproxy-item.js";
/**
* @polymer
* @extends HTMLElement
*/

class MapproxyList extends LitElement {
  static get properties() {
    return {
      config: {
        type: Object
      },
      list: {
        type: Array
      }
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
        fetch(this.config.adminserver + 'mapproxylist').then(response => response.json()).then(json => {
          this.list = json; //this.requestUpdate();
        });
      }
    }

    if (changedProperties.has('list')) {
      console.log('list changed');
    }

    return true;
  }

  render() {
    return html`${this.list.map(item => html`
            <mapproxy-item .item="${item}" @itemdelete="${e => this.deleteItem(e)}"></mapproxy-item><br>`)}`;
  }

  deleteItem(e) {
    this.list = this.list.filter(item => item.name !== e.detail);
  }

}

window.customElements.define('mapproxy-list', MapproxyList);