public with sharing class Document {
    /* @AuraEnabled
     public static void deleteContentVersion(String contentVersId) {        
         ContentVersion cv = [SELECT Id, FirstPublishLocationId, ContentDocumentId FROM ContentVersion WHERE Id =: contentVersId WITH SECURITY_ENFORCED];      
         ContentDocument cd = [SELECT Id FROM ContentDocument WHERE Id =: cv.ContentDocumentId WITH SECURITY_ENFORCED];
         
         if(ContentDocument.sObjectType.getDescribe(SObjectDescribeOptions.DEFERRED).isDeletable()){
             delete cd;
         }       
     }*/
     
     @AuraEnabled
     public static String uploadFiles(String recordId, String filedata) {
         try {
             if(String.isNotBlank(FileData)) {
                 List<FileDataWP> files = (List<FileDataWP>) JSON.deserialize(filedata, List<FileDataWP>.class);
  
                 List<ContentVersion> cvList = new List<ContentVersion>();
                 for(FileDataWP file : files) {
                     ContentVersion conVer = new ContentVersion();
                     conVer.ContentLocation = 'S'; // S = Salesforce, E = External Files
                     conVer.VersionData = EncodingUtil.base64Decode(file.fileContent);
                     conVer.Title = file.fileName;
                     conVer.PathOnClient = file.fileName;
                     cvList.add(conVer);
                 }
                 Insert cvList;
  
                 List<ContentDocumentLink> cdList = new List<ContentDocumentLink>();
                 for(ContentVersion cv : [SELECT ContentDocumentId FROM ContentVersion WHERE Id =: cvList]) {
                     ContentDocumentLink conDocLink = New ContentDocumentLink();
                     conDocLink.LinkedEntityId = recordId;
                     conDocLink.ContentDocumentId = cv.ContentDocumentId;
                     conDocLink.Visibility = 'AllUsers';
                     conDocLink.shareType = 'V'; // V = Viewer, C = Collaborator, I = Inferred
                     cdList.add(conDocLink);
                 }
                 Insert cdList;        
             } else {
                 return 'record Id is Blank';
             }
             return 'success';
         } catch (Exception ex) {
             System.debug(ex.getMessage() + ' -> ' + ex.getStackTraceString());
             throw new AuraHandledException(ex.getMessage());
         }
     }
     
  
     public class FileDataWP {
         public String fileName;
         public String fileContent;
     }
     
     @AuraEnabled
     public static Map<ID, String> getRelatedFilesByRecordId(String recordId) {
         System.debug('Record Id='+recordId);
         // Get record file IDs        
         List<ContentDocumentLink> files = [SELECT ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId = :recordId];
         List<ID> fileIDs = new List<ID>();
         for (ContentDocumentLink docLink : files) {
             fileIDs.add(docLink.ContentDocumentId);
         }
  
         List<ContentVersion> docs = [SELECT ContentDocumentId, FileExtension, Title 
             FROM ContentVersion WHERE ContentDocumentId IN : fileIDs];
         Map<ID, String> mapIdTitle = new Map<ID, String>();
         for (ContentVersion docLink : docs) {
             mapIdTitle.put(docLink.ContentDocumentId, docLink.Title);
         }
         return mapIdTitle;
     }
     // for delete 
    
 @AuraEnabled
     public static String deleteSelectedfile(Id docId, Id employeeId) {
         try {
             System.debug('Deleting ContentDocument with Id: ' + docId);
             
             // First delete the associated ContentDocumentLink records
             List<ContentDocumentLink> links = [SELECT Id FROM ContentDocumentLink WHERE ContentDocumentId = :docId AND LinkedEntityId =:employeeId];
             delete links;
 
             // Then delete the ContentDocument record
             ContentDocument doc = [SELECT Id FROM ContentDocument WHERE Id = :docId];
             delete doc;
             return 'SUCCESS';
         } catch (DmlException dmlEx) {
             System.debug('DML Exception: ' + dmlEx.getMessage() + ' -> ' + dmlEx.getStackTraceString());
             throw new AuraHandledException('Error deleting the file: ' + dmlEx.getMessage());
         } catch (Exception ex) {
             System.debug('Exception: ' + ex.getMessage() + ' -> ' + ex.getStackTraceString());
             throw new AuraHandledException('An unexpected error occurred: ' + ex.getMessage());
         }
     }
  }