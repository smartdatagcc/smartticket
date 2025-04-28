import { Component, OnInit, Input, Optional, forwardRef } from '@angular/core';
import { ComponentDataService } from 'src/app/services/ComponentData-Service/component-data.service';
import { ControlTemplateDataModel } from 'src/app/model/control-template-data-model';
import { ControlContainer, NgForm, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-checkboxlist',
  templateUrl: './checkboxlist.component.html',
  styleUrls: ['./checkboxlist.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
})
export class CheckboxlistComponent implements OnInit {
  // Declaring the Input variables
  @Input() index: number;
  @Input() control: ControlTemplateDataModel;
  @Input() formsubmitted: boolean;
  isChecked = false;
  // Declaring the variable for holding the result
  selectedvalue: string[] = [];

  constructor(private componentData: ComponentDataService, @Optional() private ngForm: NgForm) { }

  ngOnInit(): void {
    if (this.control.value == null) {
      this.control.value = [];
    } else {
      this.selectedvalue = this.control.value;
    }
  }

  // check value is there
  checkedornot(option) {
    return this.selectedvalue.includes(option);
  }

  // onChange event
  // update the selected values into the service object
  onChange(name: string, isChecked: boolean) {
    this.ngForm.form.markAsDirty();
    if (isChecked) {
      this.selectedvalue.push(name);
      if (this.selectedvalue.length > 0) {
        this.ngForm.form.controls['checklist__' + this.index].setErrors(null);
      }
    }
    else {
      const index = this.selectedvalue.indexOf(name, 0);
      if (index > -1) {
        this.selectedvalue.splice(index, 1);
      }
      if (this.selectedvalue.length === 0) {
        this.ngForm.form.controls['checklist__' + this.index].setErrors({ invalid: true });
      }
    }
    this.control.value = this.selectedvalue;
  }

}
