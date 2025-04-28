import { Component, OnInit, Input } from '@angular/core';
import { ComponentDataService } from 'src/app/services/ComponentData-Service/component-data.service';
import { ControlTemplateDataModel } from 'src/app/model/control-template-data-model';
import { ControlContainer, NgForm } from '@angular/forms';

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class SelectComponent implements OnInit {

  // Declaring the Input variables
  @Input() index: number;
  @Input() control: ControlTemplateDataModel;
  @Input() formsubmitted: boolean;
  // Declaring the variable for holding the result
  selectedvalue: string;

  constructor(private componentData: ComponentDataService) { }

  ngOnInit(): void {
  }

  // onChange event
  // update the selected values into the service object
  onChange(value) {
    if (this.componentData && this.componentData.newticket && this.componentData.newticket['metadata']) {
      this.componentData.newticket['metadata'][this.index].value = value.target.value;
    }
  }

}
