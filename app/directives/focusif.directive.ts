import { Input, Directive, Inject, ElementRef, OnInit, OnChanges } from '@angular/core'


@Directive({
    selector: '[focusif]'
})
export class FocusIfDirective implements OnChanges, OnInit {
    @Input('focusif') focusif: string;

    constructor( @Inject(ElementRef) private element: ElementRef) { }
    public ngOnChanges() {
       
        this.applyFocus();
        //this.element.nativeElement.focus();
    }
    public ngOnInit() {
        this.applyFocus();
        //this.element.nativeElement.blur();
    }

    private applyFocus(){
        if(this.isTrue(this.focusif)){
            this.element.nativeElement.focus();
        }else{
            this.element.nativeElement.blur();
        }
    }

    // REFACTOR : to extract to a shared service
    private isTrue(value:string){
        return (value === "true" || value === "1");
    }
    
}