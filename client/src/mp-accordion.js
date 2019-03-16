import {LitElement, html, css} from 'lit-element';

/**
* @polymer
* @extends HTMLElement
*/
class MpAccordion extends LitElement {
    static get properties() {
        return {
            open: {type: Boolean}
        }
    }
    static get styles() {
        return css `
            :host {
                display: block;
            }
            .accordion {
                background-color: #eee;
                color: #444;
                cursor: pointer;
                padding: 18px;
                width: 100%;
                text-align: left;
                border: none;
                outline: none;
                transition: 0.4s;
                margin-top: 3px;
                margni-bottom: 3px;
                font-weight: bold;
            }
            .active, .accordion:hover {
                background-color: #ccc;
            }
            .accordion:after {
                content: '+'; 
                font-size: 13px;
                color: #777;
                float: right;
                margin-left: 5px;
            }
            .active:after {
                content: "-"; 
            }
        `
    }
    constructor() {
        super();
        this.open = false;
    }
    render(){
        return html`
            <button class="accordion${this.open?' active':''}" @click="${e=>this.handleClick(e)}"><slot></slot></button>
            `
    }
    handleClick(e) {
        this.open = !this.open;
    }
}

window.customElements.define('mp-accordion', MpAccordion);