import { Component, OnInit, Input } from '@angular/core';
import { ComponentDataService } from 'src/app/services/ComponentData-Service/component-data.service';
import { ControlTemplateDataModel } from 'src/app/model/control-template-data-model';
import { ControlContainer, NgForm } from '@angular/forms';

@Component({
  selector: 'app-radiobuttonlist',
  templateUrl: './radiobuttonlist.component.html',
  styleUrls: ['./radiobuttonlist.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class RadiobuttonlistComponent implements OnInit {
  // Declaring the Input variables
  @Input() index: number;
  @Input() control: ControlTemplateDataModel;
  @Input() formsubmitted: boolean;
  // Declaring the variable for holding the result
  selectedvalue: string;

  constructor(private componentData: ComponentDataService) { }
  ngOnInit(): void {
    if (this.control.value == null) {
      this.control.value = '';
    } else {
      this.selectedvalue = this.control.value;
    }
  }
  // onChange event
  // update the selected values into the service object
  onChange(name: string, isSelected: boolean) {
    if (isSelected) {
      this.selectedvalue = name;
      this.control.value = name;
    }
  }
}
