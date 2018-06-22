import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {FormBuilder, Validators, FormGroup} from "@angular/forms";
import {isArray, isString} from "util";
import {Observable} from "rxjs/Rx";
import {catchError} from "rxjs/internal/operators";
import {MatSnackBar} from "@angular/material";



export function _(str: string) {
  return str;
}


const TYPE_WIDGETS = {
    "boolean": {"widget": "checkbox"},
    "date": {"widget": "datetime"},
};


function getField(data, api){
    if(isString(data)) {
        data = {"field": data};
    }
    if(data['widget'] === undefined) {
        let options = api.serializer.getFieldOptions(data['field']);
        let type = options['typeName'];
        Object.assign(data, TYPE_WIDGETS[type] || {});
        if(options['isSerializer']) {
            data['widget'] = 'search-input';
            let apiClass = options['type']['api_class'];
            data['queryset'] = data['queryset'] || api.injector.get(apiClass);
        }
    }
    if(data['required'] === undefined) {
        data['required'] = true;
    }
    if(data['widget'] === undefined) {
        data['widget'] = "input";
    }
    if(data['widget'] == "input" && data['type'] === undefined) {
        data['type'] = "text";
    }
    if(!data['flex']) {
        data['flex'] = 100;
    }
    data['placeholder'] = api.getLabel(data['field']);
    data['help_text'] = api.getHelpText(data['field']);
    return data;
}

function getControlConfig(field, value = '') {
    let config: any[] = [];
    let data = {};
    data['disabled'] = field['disabled'] || false;
    data['value'] = field['default'] || '';
    data['value'] = value || field['default'];

    config.push(data);
    if(field['required']) {
        config.push(Validators.required);
    }
    return config;
}


@Component({
    selector: 'django-form',
    templateUrl: './django-form.component.html',
    styleUrls: ['./django-form.component.css']
})
export class DjangoFormComponent implements OnInit, OnChanges {

    schema: any;
    form: FormGroup;
    @Input() api: any;
    @Input() instance: any;
    @Input() fields: any[] = [];

    constructor(public formBuilder: FormBuilder,
                public snackBar: MatSnackBar) { }

    ngOnInit() {
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.initForm();
    }

    initForm() {
        let controlsConfig = {};
        this.api.options().subscribe(() => {
            this.schema = this.fields.map((itemsArray) => {
                if(!isArray(itemsArray)){
                    itemsArray = [itemsArray];
                }
                return itemsArray.map((item) => {
                    let field = getField(item, this.api);
                    let value: any = '';
                    if(this.instance) {
                        value = this.instance.getValue(field['field']);
                    }
                    controlsConfig[field['field']] = getControlConfig(item, value);
                    return field;
                });
            });

            this.form = this.formBuilder.group(controlsConfig);

        });
    }

    getErrorMessage(field) {
        let err = field.hasError('required') ? _('You must enter a value') :
            field.hasError('email') ? _('Not a valid email') :
                '';
        if(!err){
            let errList = Object.keys(field.errors);
            err = errList.join(', ');
            console.log(err);
        }
        return err;
    }

    getApiMethod(data) {
        return this.api.create(data)
    }

    processData(data) {
        return data;
    }

    onFormSubmit(data) {
        data = this.processData(data);
        this.getApiMethod(data)
            .pipe(catchError((err, caught) => {
                console.log(err);
                Object.keys(err.error).forEach(key => {
                    let value = err.error[key];
                    let errorDict = {};
                    for (let item of value) {
                        errorDict[item] = true;
                    }
                    this.form.controls[key].setErrors(errorDict);
                });
                return Observable.empty();
            }))
            .subscribe(() => {
            this.snackBar.open('Success', 'Close', {
                duration: 3000,
            });

        });
    }

}
