import {LitElement, html, css} from 'lit-element';

/**
* @polymer
* @extends HTMLElement
*/
class MapproxyConfig extends LitElement {
    static get properties() {
        return {
            config: {type: Object},
            localConfig: {type: Object},
            open: {type: Boolean}
        };
    }
    static get styles() {
        return css `
            :host {
                display: block;                
            }
        `
    }
    constructor() {
        super();
        this.config = {};
        this.localConfig = window.localStorage.config?JSON.parse(window.localStorage.config):{}
        this.open = false;
    }
    shouldUpdate(changedProperties) {
        if (changedProperties.has('config')) {
            if (!window.localStorage.config) {
                window.localStorage.config = JSON.stringify(this.config);
                this.localConfig = JSON.parse(window.localStorage.config);
            }
        }
        return true;
    }
    render(){
        return html`<button @click="${e=>this.toggleOpen(e)}">Edit metadata</button><br>
            ${this.configForm()}
            `
    }
    configForm(){
        if (!this.open) {
            return html``;
        }
        return html`
            <label for="mapproxydir">Mapproxy root directory:</label>
            <input type="text" id="mapproxydir" name="mapproxydir" size="65" value="${this.localConfig.mapproxydir}"><br>
            <label for="online_resource">Online resource</label>
            <input type="text" id="online_resource" name="online_resource" size="65" value="${this.localConfig.metadata.online_resource}"><br>
            <label for="access_constraints">Access constraints</label>
            <input type="text" id="access_constraints" name="access_constraints" size="65" value="${this.localConfig.metadata.access_constraints}"><br>
            <label for="fees">Fees</label>
            <input type="text" id="fees" name="fees" size="65"  value="${this.localConfig.metadata.fees}"><br>
            <b>Contact</b><br>
            <label for="person">Person</label>
            <input type="text" id="person" name="person" size="65"  value="${this.localConfig.metadata.contact.person}"><br>
            <label for="position">Position</label>
            <input type="text" id="position" name="position" size="65"  value="${this.localConfig.metadata.contact.position}"><br>
            <label for="organization">Organization</label>
            <input type="text" id="organization" name="organization" size="65"  value="${this.localConfig.metadata.contact.organization}"><br>
            <label for="city">City</label>
            <input type="text" id="city" name="city" size="65"  value="${this.localConfig.metadata.contact.city}"><br>
            <label for="postcode">Postcode</label>
            <input type="text" id="postcode" name="postcode" size="65"  value="${this.localConfig.metadata.contact.postcode}"><br>
            <label for="country">Country</label>
            <input type="text" id="country" name="country" size="65"  value="${this.localConfig.metadata.contact.country}"><br>
            <label for="email">E-mail</label>
            <input type="text" id="email" name="email" size="65"  value="${this.localConfig.metadata.contact.email}"><br>
            <button @click="${e=>this.saveConfig()}">Save</button>
            <button @click="${e=>this.resetConfig()}">Reset to default</button>
            `
    }
    toggleOpen(e) {
        this.open = !this.open;
    }
    emitLocalConfigUpdate() {
        this.dispatchEvent(new CustomEvent('localConfigUpdate', {
            bubbles: true,
            composed: true
        }));
    }
    saveConfig() {
        this.localConfig.mapproxydir = this.shadowRoot.querySelector('#mapproxydir').value;
        this.localConfig.metadata.online_resource = this.shadowRoot.querySelector('#online_resource').value;
        this.localConfig.metadata.access_constraints = this.shadowRoot.querySelector('#access_constraints').value;
        this.localConfig.metadata.fees = this.shadowRoot.querySelector('#fees').value;
        this.localConfig.metadata.contact.person = this.shadowRoot.querySelector('#person').value;
        this.localConfig.metadata.contact.position = this.shadowRoot.querySelector('#position').value;
        this.localConfig.metadata.contact.organization = this.shadowRoot.querySelector('#organization').value;
        this.localConfig.metadata.contact.city = this.shadowRoot.querySelector('#city').value;
        this.localConfig.metadata.contact.postcode = this.shadowRoot.querySelector('#postcode').value;
        this.localConfig.metadata.contact.country = this.shadowRoot.querySelector('#country').value;
        this.localConfig.metadata.contact.email = this.shadowRoot.querySelector('#email').value;
        window.localStorage.config = JSON.stringify(this.localConfig);
        this.emitLocalConfigUpdate();
    }
    resetConfig() {
        window.localStorage.config = JSON.stringify(this.config);
        this.localConfig = JSON.parse(window.localStorage.config);
        this.emitLocalConfigUpdate();
    }
}

window.customElements.define('mapproxy-config', MapproxyConfig);