import LightningDatatable from "lightning/datatable";
import customPicklist from './customPicklist.html'
import customPicklistStatic from './customPicklistStatic.html'

export default class CustomDataTable extends LightningDatatable {
    static customTypes = {
        customPicklist: {
            template: customPicklistStatic,
            editTemplate: customPicklist,
            standardCellLayout: true,
            typeAttributes: ['label', 'placeholder', 'options', 'value', 'context']
        }
    };
}