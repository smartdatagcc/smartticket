import { Component, OnInit, Input } from '@angular/core';
import { ComponentDataService } from 'src/app/services/ComponentData-Service/component-data.service';
import { ControlTemplateDataModel } from 'src/app/model/control-template-data-model';
import { ControlContainer, NgForm } from '@angular/forms';

@Component({
  selector: 'app-phonenumber',
  templateUrl: './phonenumber.component.html',
  styleUrls: ['./phonenumber.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class PhonenumberComponent implements OnInit {

  // Declaring the Input variables
  @Input() index: number;
  @Input() control: ControlTemplateDataModel;
  @Input() formsubmitted: boolean;
  number = '';

  constructor(private componentData: ComponentDataService) { }
  ngOnInit(): void {
  }

  texthandler(value) {
    if (this.componentData && this.componentData.newticket && this.componentData.newticket['metadata']) {
      this.componentData.newticket.metadata[this.index].value = value.target.value;
    }
  }

}
