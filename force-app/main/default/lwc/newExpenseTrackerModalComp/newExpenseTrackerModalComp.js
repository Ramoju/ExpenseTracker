import { api } from 'lwc';
import LightningModal from 'lightning/modal';

export default class NewExpenseTrackerModalComp extends LightningModal {
    @api categoryoptions;
    categoryValue;
    expenseDate;
    amount;
    otherinfo;

    handleDismiss(){
        this.close();
    }

    handleSaveClick(){
        this.close({
            newExpenseRecord : {
                'Expense_Date__c': this.expenseDate,
                'Expense_Category__c': this.categoryValue,
                'Amount__c': this.amount,
                'Remarks__c': this.otherinfo
            }
        });
        const event = new CustomEvent('addnewrecord', {
            detail: { 
                'Expense_Date__c': this.expenseDate,
                'Expense_Category__c': this.categoryValue,
                'Amount__c': this.amount,
                'Remarks__c': this.otherinfo 
            }
        });
        this.dispatchEvent(event);
    }

    handleCategoryChange(event){
        this.categoryValue = event.detail.value;
    }

    handleExpenseDate(event){
        this.expenseDate = event.detail.value;
    }

    handleAmount(event){
        this.amount = event.detail.value;
    }

    handleComments(event){
        this.otherinfo = event.detail.value;
    }
}