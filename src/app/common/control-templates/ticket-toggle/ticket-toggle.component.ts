import { Component, OnInit, Input, Output, EventEmitter, Optional } from '@angular/core';
import { ComponentDataService } from 'src/app/services/ComponentData-Service/component-data.service';
import { ControlTemplateDataModel } from 'src/app/model/control-template-data-model';
import { ThemePalette } from '@angular/material/core';
import { ControlContainer, NgForm } from '@angular/forms';

@Component({
  selector: 'app-ticket-toggle',
  templateUrl: './ticket-toggle.component.html',
  styleUrls: ['./ticket-toggle.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class TicketToggleComponent implements OnInit {
  constructor(private componentData: ComponentDataService, @Optional() private ngForm: NgForm) { }
  // Declaring the Input variables
  @Input() index: number;
  @Input() control: ControlTemplateDataModel;
  @Output() notifyChanged = new EventEmitter<boolean>();
  @Input() isChecked = false;
  @Input() isDisabled = false;
  color: ThemePalette = 'primary';
  selectedvalue: string;
  ngOnInit(): void {
    if (this.control != undefined) {
      if (this.control.value != null || this.control.value !== ''){
        this.isChecked = !this.control.value;
        this.selectedvalue = this.control.value === true ? this.control.options[0] : this.control.options[1];
      }else{
        this.control.value = false;
        this.selectedvalue = this.control.value;
      }
    }
  }
  // onChange event
  // update the selected values into the service object
  onChange(toggleStatus) {
    this.control.value = toggleStatus.checked === false ? true : false;
    this.selectedvalue = toggleStatus.checked === false ? this.control.options[0] : this.control.options[1];
    this.ngForm.form.controls['tickettoggle_' + this.index].markAsDirty();
    //  this.notifyChanged.emit(toggleStatus.checked);
    /* -- Below code was used for testing the toggle function in the sample ticket page
    this.componentData.newticket['metadata'][this.index].value = toggleStatus.checked;
    console.log(toggleStatus.checked);
    console.log(this.componentData);
    */
  }

}
