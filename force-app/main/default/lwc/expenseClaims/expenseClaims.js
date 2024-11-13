import { LightningElement, track, wire } from 'lwc';
import saveRecords from '@salesforce/apex/ExpenseTrackerController.saveRecords';
import getRecords from '@salesforce/apex/ExpenseTrackerController.getRecords';
import getExpenseActivityOptions from '@salesforce/apex/ExpenseTrackerController.getExpenseActivityOptions'
import ExpenseFileUpload from "c/expenseFileUpload";
import { NavigationMixin } from 'lightning/navigation';
import {refreshApex} from '@salesforce/apex'
import userId from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import { getObjectInfo, getPicklistValues } from "lightning/uiObjectInfoApi";
import EXPENSE_TRACKER_OBJECT from "@salesforce/schema/Expense_Tracker__c";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import FIRST_NAME from '@salesforce/schema/User.FirstName';
import LAST_NAME from '@salesforce/schema/User.LastName';
import EXPENSE_CATEGORY from '@salesforce/schema/Expense_Tracker__c.Expense_Category__c';
import EXPENSE_DATE from '@salesforce/schema/Expense_Tracker__c.Expense_Date__c';
import AMOUNT from '@salesforce/schema/Expense_Tracker__c.Amount__c';
import REMARKS from '@salesforce/schema/Expense_Tracker__c.Remarks__c';

const actions = [
    { label: 'Copy', name: 'copy' },
    { label: 'Delete', name: 'delete' },
    { label: 'Add Attachments', name: 'add_attachments'}
];

const columns = [
    { label: 'Incurred Date', fieldName: EXPENSE_DATE.fieldApiName, type: 'date-local', editable: true },
    {
        label: 'Expense Category', fieldName: 'Expense_Category__c', type: 'customPicklist', editable: true, wrapText: true, 
        typeAttributes: {
            placeholder: 'Choose Category', 
            options: { fieldName: 'categories' }, 
            value: { fieldName: 'Expense_Category__c' },
            context: {fieldName: 'Id'}
        }
    },
    { label: 'Amount', fieldName: AMOUNT.fieldApiName, type: 'currency', editable: true },
    { label: 'Other Info', fieldName: REMARKS.fieldApiName, type: 'text', editable: true },
    {
        type: 'action',
        typeAttributes: { rowActions: actions },
    },
];

export default class ExpenseClaims extends NavigationMixin(LightningElement) {
    columns = columns
    @track expensetrackers = [];
    @track draftValues = [];
    @track error;
    @track expenseActivities = [];
    toDeleteRecordIds = [];
    userName
    expenseClaimName
    expenseClaimDate
    activityValue
    expenseTrackerRecordTypeId
    @track categories = []

    @wire(getRecord, { recordId: userId, fields: [FIRST_NAME, LAST_NAME] })
    userFullName({error, data}){
        if(error){
            this.error = error;
        } else if(data){
            if (data.fields.FirstName.value != null || data.fields.LastName.value != null) {
                this.userName = data.fields.FirstName.value + ' ' + data.fields.LastName.value;
            }
        }
    }

    @wire(getObjectInfo, { objectApiName: EXPENSE_TRACKER_OBJECT })
    results({ error, data }) {
        if (data) {
            this.expenseTrackerRecordTypeId = data.defaultRecordTypeId;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.expenseTrackerRecordTypeId = undefined;
        }
    }

    @wire(getPicklistValues, { recordTypeId: "$expenseTrackerRecordTypeId", fieldApiName: EXPENSE_CATEGORY })
    picklistResults({ error, data }) {
        if (data) {
            console.log('picklist data ' + data.values);
            this.categories = data.values;
            console.log('categories: ' + this.categories);
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.categories = undefined;
        }
    }

    @wire(getRecords, { pickList: '$categories', expenseClaimName: 'Test Claim' })
    expenseTrackerData(result) {
        if (result.data) {
            let options = [];
            for(var key in this.categories){
                options.push({label: this.categories[key].label, value:this.categories[key].value});
            }
            this.expensetrackers = result.data.map(record => {
                return {
                    ...record,
                    'categories': options
                }
            });
 
        } else if (result.error) {
            this.expensetrackers = undefined;
        }
    };

    @wire(getExpenseActivityOptions)
    expenseActivityOptions({error,data}){
        if(data){
            for(var i=0; i<data.length; i++) {
                console.log('id=' + data[i].Id);
                this.expenseActivities = [...this.expenseActivities ,{value: data[i].Id , label: data[i].Label}];                                   
            } 
        }else if(error){

        }
    }


    handleFieldChange(event) {
        if(event.target.label == 'Expense Claim Name'){
            this.expenseClaimName = event.detail.value;
        } else if(event.target.label == 'Incurred Date'){
            this.expenseClaimDate = event.detail.value;
        }
    }

    handleAddRecord() {
        this.expensetrackers = [...this.expensetrackers, ({
            Expense_Date__c: '',
            Expense_Category__c: '',
            Amount__c: '',
            Remarks_c: '',
            categories: this.categories
        })];
    }

    handleActivityChange(event){
        this.activityValue = event.detail.value;
    }

    handleSave(event){
        //this.draftValues = event.detail.draftValues;
        this.draftValues = event.detail.draftValues.map(draftValue => {
            return {
                ...draftValue,
                'expense_claim_name': this.expenseClaimName
            }
        });
        console.log('draft values ' + JSON.stringify(this.draftValues));
    }

    handleCancel(){
        this.draftValues = [];
        this.refresh();
    }

    handleCellChange(event){
        console.log('In cell change');
        let draftValues = event.detail.draftValues;
        console.log('In cell change draft values:' + JSON.stringify(draftValues));
        console.log(event.target.label);
        console.log(event.target.value);
        // draftValues.forEach(element => {
        //     this.updateDraftValues(element);
        // });
    }

    handleRowAction(event){
        const action = event.detail.action;
        const row = event.detail.row;
        console.log('selected row:' + JSON.stringify(row));
        switch (action.name) {
            case 'copy': this.expensetrackers = [...this.expensetrackers, row];
                         this.draftValues = [...this.draftValues, row];
                         break;
            case 'delete':  let recordIndex = this.expensetrackers.findIndex((record)=>record.Id===event.detail.row.Id);
                            this.expensetrackers.splice(recordIndex,1);
                            this.expensetrackers = [...this.expensetrackers];
                            this.toDeleteRecordIds.push(event.detail.row.Id);
                            break;
            case 'add_attachments': ExpenseFileUpload.open({
                                        expenseRecordId : event.detail.row.Id
                                    });
                                    break;
        }
    }

    // updateDraftValues(updateItem)   {
    //     let draftValueChanged = false;
    //     let copyDraftValues = [...this.draftValues];
    //     copyDraftValues.forEach(item =>   {
    //         console.log(JSON.stringify(item));
    //         console.log('Item Id: ' + item.id);
    //         if (item.Id === updateItem.Id) {
    //             for (let field in updateItem) {
    //                 item[field] =   updateItem[field];
    //             }
    //             draftValueChanged = true;
    //         }
    //     });
    
    //     if (draftValueChanged) {
    //         this.draftValues =   [...copyDraftValues];
    //     } else {
    //         this.draftValues =   [...copyDraftValues, updateItem];
    //     }
    //    }

    handleSaveRecords() {
        saveRecords({ records: this.draftValues, toDeleteRecordIds: this.toDeleteRecordIds })
            .then(() => {
                this.showToast('Success', 'Records saved successfully', 'success');
                this.refresh();
                this.draftValues = [];
            })
            .catch(error => {
                //this.error = error.body.message;
                this.showToast('Error', error.body.message, 'error');
            });
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant
        });
        this.dispatchEvent(event);
    }

    async refresh(){
        await refreshApex(this.draftValues);
        await refreshApex(this.expensetrackers);
    }
}
