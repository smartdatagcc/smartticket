import { Component, OnInit, Input } from '@angular/core';
import { ComponentDataService } from 'src/app/services/ComponentData-Service/component-data.service';
import { ControlTemplateDataModel } from 'src/app/model/control-template-data-model';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { ControlContainer, NgForm } from '@angular/forms';

@Component({
  selector: 'app-datepicker',
  templateUrl: './datepicker.component.html',
  styleUrls: ['./datepicker.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class DatepickerComponent implements OnInit {

  // Declaring the Input variables+
  @Input() index: number;
  @Input() control: ControlTemplateDataModel;
  @Input() formsubmitted: boolean;

  maxDate = new Date(2999, 12, 31);

  constructor(private componentData: ComponentDataService) { }

  ngOnInit(): void {
    if (this.control.value == null) {
      this.control.value = '';
    }
  }

  addEvent(type: string, event: MatDatepickerInputEvent<Date>) {
    if (this.componentData && this.componentData.newticket && this.componentData.newticket['metadata']) {
      this.componentData.newticket['metadata'][this.index].value = event.value.toISOString();
    }
  }

}
