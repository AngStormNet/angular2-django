import {
    Component,
    ComponentFactoryResolver, Directive,
    Input,
    OnChanges,
    OnInit,
    SimpleChanges,
    TemplateRef, Type,
    ViewChild, ViewContainerRef
} from '@angular/core';


export class DynamicItem {
  constructor(public component: Type<any>, public data: any) {}
}


@Directive({
  selector: '[view-container]',
})
export class ViewContainerDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}


@Component({
    selector: 'dynamic-component',
    template: `
        <ng-template view-container></ng-template>
    `
})
export class DynamicComponentComponent implements OnInit {

    @Input() config: DynamicItem;
    @ViewChild(ViewContainerDirective) template: ViewContainerDirective;

    constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

    addComponent() {
        let componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.config.component);

        let viewContainerRef = this.template.viewContainerRef;
        viewContainerRef.clear();

        let componentRef = viewContainerRef.createComponent(componentFactory);

        Object.keys(this.config.data).forEach((key) => {
            (<any>componentRef.instance)[key] = this.config.data[key];
        });

    }

    ngOnInit(): void {
        this.addComponent();
    }
}
