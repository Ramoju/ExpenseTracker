import { api,track } from 'lwc';
import LightningModal from 'lightning/modal';
import getRelatedFilesByRecordId from '@salesforce/apex/Document.getRelatedFilesByRecordId';
import deleteSelectedfile from "@salesforce/apex/Document.deleteSelectedfile";
import uploadFiles from '@salesforce/apex/Document.uploadFiles';
import userId from '@salesforce/user/Id';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import {NavigationMixin} from 'lightning/navigation';
const MAX_FILE_SIZE = 2097152;

export default class ExpenseFileUpload extends NavigationMixin(LightningModal) {
    @api expenseRecordId;
    @track fileList =[];
    @track uploadfilesData = [];
    @track docId;
    @track showSpinner = false;

    // connectedCallBack(){
    //     this.uploadedDocument();
    // }

    uploadedDocument(){
        getRelatedFilesByRecordId({recordId: this.expenseRecordId})
        .then(data =>{
            if(data)
            {
              this.fileList = Object.keys(data).map(item=>({"label":data[item],"value": item}))
            }
        })
        .catch(error => {
            console.log(error);
        })
    }

    uploadFiles() {
        console.log('record id:' + this.expenseRecordId);
        if(this.uploadfilesData == [] || this.uploadfilesData.length == 0) {
            this.showToast('Error', 'error', 'Please select files first'); 
            return;
        }
        if(this.expenseRecordId === undefined){
            this.expenseRecordId = userId;
        }

        this.showSpinner = true;
        uploadFiles({
            recordId : this.expenseRecordId,
            filedata : JSON.stringify(this.uploadfilesData)
        })
        .then(data => {
            this.uploadfilesData = [];
            if(data==="success"){
                this.uploadedDocument();
                this.showToast('Success', 'success', 'Files Uploaded successfully.');
            }
        }).catch(error => {
            if(error && error.body && error.body.message) {
                this.showToast('Error', 'error', error.body.message);
            }
        }).finally(() => this.showSpinner = false );
    }

    handleFileUploaded(event) {
        if (event.target.files.length > 0) {
            console.log('length check passed');
            for(var i=0; i< event.target.files.length; i++){
                console.log('Inside for loop');
                if (event.target.files[i].size > MAX_FILE_SIZE) {
                    console.log('File size too big');
                    this.showToast('Error!', 'error', 'File size exceeded the upload size limit.');
                    return;
                }
                console.log('Validated beofre file reader');
                let file = event.target.files[i];
                console.log('File assigned to variable:' + file);
                let reader = new FileReader();
                reader.onload = e => {
                    var fileContents = reader.result.split(',')[1]
                    this.uploadfilesData.push({'fileName':file.name, 'fileContent':fileContents});
                };
                console.log('after file reader:' + JSON.stringify(this.uploadfilesData));
                reader.readAsDataURL(file);
                console.log('after read as data url');
            }
        }
    }

    previewHandler(event){
        this[NavigationMixin.Navigate]({ 
            type:'standard__namedPage',
            attributes:{ 
                pageName:'filePreview'
            },
            state:{ 
                selectedRecordId: event.target.dataset.id
            }
        })
    } 

    removeReceiptImage(event) {
        var index = event.currentTarget.dataset.id;
        this.uploadfilesData.splice(index, 1);
    }

    showToast(title, variant, message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                variant: variant,
                message: message,
            })
        );
    }

    deleteSelectedRecords(event)
    {
      let recordIds = event.currentTarget.dataset.id;
      
      deleteSelectedfile({docId: recordIds , employeeId: this.expenseRecordId })
      .then(result => {
        if(result == 'SUCCESS') {
        this.dispatchEvent(
          new ShowToastEvent({
            title: 'Success',
            message: 'Selected record is deleted!',
            variant: 'success',
          }),
        );
        }
        for(var i=0; i< this.fileList.length; i++){
            this.fileList = this.fileList.filter((ele) => {
            return (ele.value !== recordIds);
        });
        }
      })
      .catch(error => {
        this.message = undefined;
        this.error = error;
        this.dispatchEvent(
          new ShowToastEvent({
            title: 'Error creating records',
            message: error.body.pageError[0].message,
            variant: 'error',
          
          }),
        );
        console.log("error", JSON.stringify(this.error));
      });
    } 

    // handleUploadFinished(event){
    //     console.log(JSON.stringify(event.detail.files));
    //     event.detail.files.forEach((file) => {
    //         //var x = arrayItem.prop1 + 2;
    //         console.timeLog('Document Id:' + file.documentId);
    //         console.log('File name:' + file.name);
    //         this.data.push(file.name);
    //         this.documentIds.push(documentId);
    //     });
    //     for(let file in event.detail.files){
    //         console.log('File name ' + file.name);
    //         this.data.push(file.name);
    //         console.log('Document Id ' + file.documentId);
    //         this.documentIds.push(file.documentId);
    //     }
    //     nooffiles = event.detail.files.length;
    //     console.log(this.data);
    //     console.log(this.documentIds);
    // }

    handleDone(){
        this.close();
    }
}