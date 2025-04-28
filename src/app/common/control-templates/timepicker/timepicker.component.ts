import { Component, OnInit, Input, Optional } from '@angular/core';
import { ControlTemplateDataModel } from 'src/app/model/control-template-data-model';
import { ComponentDataService } from 'src/app/services/ComponentData-Service/component-data.service';
import { ControlContainer, NgForm } from '@angular/forms';
import * as moment from 'moment';

@Component({
  selector: 'app-timepicker',
  templateUrl: './timepicker.component.html',
  styleUrls: ['./timepicker.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class TimepickerComponent implements OnInit {

  // Declaring the Input variables+
  @Input() index: number;
  @Input() control: ControlTemplateDataModel;
  @Input() formsubmitted: boolean;
  today = new Date();
  time = this.today.getHours() + ':' + this.today.getMinutes();
  timeval = '';

  constructor(private componentData: ComponentDataService, @Optional() private ngForm: NgForm) { }

  ngOnInit(): void {
    if (this.control !== undefined) {
      if (this.control.value == null) {
        this.control.value = this.time;
        this.timeval = this.time;
      } else {
        const val = this.control.value;
        this.timeval = val ? moment.utc(val).format('h:mm a') : null;
      }
    }
  }
  setTime(value) {
    this.ngForm.form.markAsDirty();
    this.control.value = value;
  }
}
