import {LitElement, html, css} from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js'


/**
* @polymer
* @extends HTMLElement
*/
class MapproxyGetCaps extends LitElement {
    static get properties() {
        return {
            open: {type: Boolean},
            capabilities: {type: Object},
            errorMessage: {type: String},
            createButtonDisabled: {type: Boolean},
            list: {type: Array}
        };
    }
    static get styles() {
        return css `
            :host {
                display: block;                
            }
            .error {
                color: red;
            }
        `
    }
    constructor() {
        super();
        this.open = false;
        this.capabilities = {};
        this.errorMessage = "";
        this.getcapabilitiesurl = "";
        this.selectedLayers = new Set();
        this.createButtonDisabled = true;
        this.list = [];
    }
    shouldUpdate(changedProperties) {
        if (changedProperties.has('list')) {
            this.updateCreateButton();
        }
        return true;
    }
    render(){
        return html`
            <button @click="${e=>this.toggleOpen()}">create from wms capabilities</button> Get layers from WMS capabilities<br>
            ${this.renderGetCapabilitiesForm()}
            ${this.renderErrorMessage()}
            ${this.renderCapabilities()}
            `
    }
    toggleOpen(){ 
        this.open = !this.open;
    }
    renderGetCapabilitiesForm() {
        if (!this.open) {
            return html``;
        }
        return html`
            <input type="text" autocomplete="url" id="wmscapabilitiesurl" name="wmscapabilitiesurl" size="128" value="${this.getcapabilitiesurl}" placeholder="HTTP(s) address of WMS service">
            <button @click="${e=>this.fetchCapabilities(e)}">Get</button>
        `;
    }
    renderErrorMessage(){
        if (!this.errorMessage) {
            return html``;
        }
        return html`<div class="error">${this.errorMessage}</div>`
    }
    renderCapabilities()  {
        if (!this.open) {
            return html``;
        }
        if (!this.capabilities.Capability) {
            return html ``;
        }
        return html`
            <div>
            <b>Title</b>: ${this.capabilities.Service.Title}<br>
            <b>Abstract</b>: ${this.capabilities.Service.Abstract}<br>
            <b>Access constraints</b>: ${this.capabilities.Service.AccessConstraints}<br>
            <b>Fees</b>: ${this.capabilities.Service.Fees?this.capabilities.Service.Fees:''}<br>
            <b>Contact information</b><br>
            <b>Primary contact</b>: ${this.capabilities.Service.ContactInformation.ContactPersonPrimary.ContactPerson}<br>
            <b>Primary contact organisation</b>: ${this.capabilities.Service.ContactInformation.ContactPersonPrimary.ContactOrganization}<br>
            <b>Contact voice telephone</b>: ${this.capabilities.Service.ContactInformation.ContactVoiceTelephone}<br>
            <b>Contact mail</b>: ${this.capabilities.Service.ContactInformation.ContactElectronicMailAddress}<br>
            <b>Layers</b><br>
            ${this.renderLayers(this.capabilities.Capability.Layer)}
            <input type="text" @input="${e=>this.checkInput(e)}" id="configname" size="20" value="" placeholder="mapproxy_config_name"> <button ?disabled="${this.createButtonDisabled}">Create</button>
            </div>
        `;
    }
    renderLayer(layer) {
        if (layer.Name) {
            return html`<input type="checkbox" ?checked="${this.selectedLayers.has(layer.Name)}" @click="${e=>this.toggleCheck(layer.Name)}"> ${layer.Name}${layer.Title?`, ${layer.Title}`:''}`;
        }
        if (layer.Title) {
            return html`${layer.Title}`;
        }
        return html`noname`;
    }
    renderLayers(Layer, depth) {
        if (!Array.isArray(Layer)) {
            Layer = [Layer];
        }
        if (!depth) {
            depth = 0;
        }
        return Layer.map(layer=>html`${unsafeHTML("&nbsp;".repeat(depth))}${this.renderLayer(layer)}<br>${layer.Layer?this.renderLayers(layer.Layer, depth+1):''}`)
    }
    updateCreateButton() {
        if (this.selectedLayers.size === 0) {
            this.createButtonDisabled = true;
        } else {
            const configname = this.shadowRoot.querySelector('#configname').value.trim().toLowerCase();            
            this.createButtonDisabled = !(/^[a-z0-9][a-z0-9_-]*$/.test(configname) && this.list.find(item=>item.name.toLowerCase().replace(/\.yaml$/,'')===configname) === undefined)
        }
    }
    checkInput(e) {
        this.updateCreateButton();
    }
    toggleCheck(layername) {
        if (this.selectedLayers.has(layername)) {
            this.selectedLayers.delete(layername);
        } else {
            this.selectedLayers.add(layername);
        }
        this.updateCreateButton();
    }
    selectAllLayers(Layer) {
        if (!Array.isArray(Layer)) {
            Layer = [Layer];
        }
        Layer.forEach(layer => {
            if (layer.Name) {
                this.selectedLayers.add(layer.Name);
            }
            if (layer.Layer) {
                this.selectAllLayers(layer.Layer);
            }
        });
    }
    fetchCapabilities(e) {
        this.capabilities = {};
        this.errorMessage = "";
        this.selectedLayers = new Set();
        this.getcapabilitiesurl = this.shadowRoot.querySelector('input[name="wmscapabilitiesurl"]').value.trim();

        if (this.getcapabilitiesurl !== "") {
            const localConfig = JSON.parse(window.localStorage.config);
            const fetchUrl = `${localConfig.adminserver}getcapabilities?wmsurl=${encodeURIComponent(this.getcapabilitiesurl)}`;
            fetch(fetchUrl)
                .then(response=>{
                    if (!response.ok) {
                        throw Error(response.statusText)
                    }
                    return response.json();
                })
                .then(json=>{
                    if (!json.Capability) {
                        throw Error(JSON.stringify(json));
                    }
                    this.capabilities = json;
                    this.selectAllLayers(this.capabilities.Capability.Layer);
                })
                .catch(error=>{
                    this.capabilities = {};
                    this.errorMessage = error;
                })
        }
    }
}

window.customElements.define('mapproxy-getcaps', MapproxyGetCaps);

/* polyfill for String.repeat */
if (!String.prototype.repeat) {
    String.prototype.repeat = function(count) {
      'use strict';
      if (this == null) {
        throw new TypeError('can\'t convert ' + this + ' to object');
      }
      var str = '' + this;
      // To convert string to integer.
      count = +count;
      if (count != count) {
        count = 0;
      }
      if (count < 0) {
        throw new RangeError('repeat count must be non-negative');
      }
      if (count == Infinity) {
        throw new RangeError('repeat count must be less than infinity');
      }
      count = Math.floor(count);
      if (str.length == 0 || count == 0) {
        return '';
      }
      // Ensuring count is a 31-bit integer allows us to heavily optimize the
      // main part. But anyway, most current (August 2014) browsers can't handle
      // strings 1 << 28 chars or longer, so:
      if (str.length * count >= 1 << 28) {
        throw new RangeError('repeat count must not overflow maximum string size');
      }
      var maxCount = str.length * count;
      count = Math.floor(Math.log(count) / Math.log(2));
      while (count) {
         str += str;
         count--;
      }
      str += str.substring(0, maxCount - str.length);
      return str;
    }
  }