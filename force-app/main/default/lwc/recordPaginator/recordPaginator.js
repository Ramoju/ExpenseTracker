import { LightningElement,wire,track } from 'lwc';
import {CurrentPageReference} from 'lightning/navigation';

export default class RecordPaginator extends LightningElement {

    @track accIds;

    connectedCallback(){
        
    }

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
       if (currentPageReference) {
          this.accIds = currentPageReference.state?.accIds;
       }
    }

    handlePrevious(){
        console.log('Acc Ids: ' + this.accIds + ' ' + window.location.origin);
    }

    handleNext(){
        console.log('Cookies ' + this.getCookie('apex_recordIds'));
        this.accIds = this.getCookie('apex_recordIds');
    }

    getCookie(cname) {
        let name = cname + "=";
        console.log(document.cookie);
        let decodedCookie = decodeURIComponent(document.cookie);
        let ca = decodedCookie.split(';');
        for(let i = 0; i <ca.length; i++) {
          let c = ca[i];
          while (c.charAt(0) == ' ') {
            c = c.substring(1);
          }
          if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
          }
        }
        return "";
      }
}