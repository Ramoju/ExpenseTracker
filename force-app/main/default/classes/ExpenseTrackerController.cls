public with sharing class ExpenseTrackerController {
    
    @AuraEnabled
    public static void saveRecords(List<Map<String, Object>> records, String[] toDeleteRecordIds) {
        List<Expense_Tracker__c> expenseTrackers = new List<Expense_Tracker__c>();
        
        for (Map<String, Object> record : records) {
            Expense_Tracker__c expensetracker = new Expense_Tracker__c();
            String rowId = (String) record.get('Id');
            if(!String.isBlank(rowId) && !rowId.toUpperCase().startsWith('ROW')){
                expensetracker.Id = (String) record.get('Id');
            }
            if(!String.isBlank((String) record.get('Expense_Date__c'))){
                String isoDate = (String) record.get('Expense_Date__c');
                expensetracker.Expense_Date__c = parseIsoDate(isoDate);
            }
            if(!String.isBlank((String) record.get('Expense_Category__c'))){
                expensetracker.Expense_Category__c = (String) record.get('Expense_Category__c');
            } 
            if(!String.isBlank(String.valueOf(Integer.valueOf(record.get('Amount__c'))))){
                expensetracker.Amount__c = Integer.valueOf(record.get('Amount__c'));
            }
            if(!String.isBlank((String) record.get('Remarks__c'))){
                expensetracker.Remarks__c = (String) record.get('Remarks__c');
            }
            if(!String.isBlank((String) record.get('expense_claim_name'))){
                expensetracker.Expense_Claim_Name__c = (String) record.get('expense_claim_name');
            }
            expenseTrackers.add(expensetracker);
        }
        if (!expenseTrackers.isEmpty()) {
            upsert expenseTrackers;
        }

        if(!toDeleteRecordIds.isEmpty()){
            List<Expense_Tracker__c> expenserecordstodelete = [SELECT Id FROM Expense_Tracker__c WHERE Id IN : toDeleteRecordIds];
            delete expenserecordstodelete;
        }
    }

    @AuraEnabled(Cacheable=true)
    public static List<Expense_Tracker__c> getRecords(String expenseClaimName) {
            return [SELECT Id, Expense_Date__c, Expense_Category__c, Remarks__c, Amount__c FROM Expense_Tracker__c WHERE Expense_Claim_Name__c = :expenseClaimName];
    }

    @AuraEnabled(Cacheable = true)
    public static List<Expense_Activity__mdt> getExpenseActivityOptions(){
        return [SELECT Id,DeveloperName,Label FROM Expense_Activity__mdt];
    }

    public static Date parseIsoDate(String isoDate) {
        if (String.isBlank(isoDate)) {
            return null;
        }
        String[] splits = isoDate.split('-');
        System.debug('Date splitted:' + splits[0] + splits[1] + splits[2]);
        System.debug(Date.newInstance(Integer.valueOf(splits[0]), Integer.valueOf(splits[1]), Integer.valueOf(splits[2])));
        return Date.newInstance(Integer.valueOf(splits[0]), Integer.valueOf(splits[1]), Integer.valueOf(splits[2]));
    }
}