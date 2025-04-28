import { Component, OnInit, Input } from '@angular/core';
import { ComponentDataService } from 'src/app/services/ComponentData-Service/component-data.service';
import { ControlTemplateDataModel } from 'src/app/model/control-template-data-model';
import { ControlContainer, NgForm } from '@angular/forms';

@Component({
  selector: 'app-email',
  templateUrl: './email.component.html',
  styleUrls: ['./email.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class EmailComponent implements OnInit {

  // Declaring the Input variables
  @Input() index: number;
  @Input() control: ControlTemplateDataModel;
  @Input() formsubmitted: boolean;
  constructor(private componentData: ComponentDataService) { }

  ngOnInit(): void {

  }

  texthandler(value) {
    if (this.componentData && this.componentData.newticket && this.componentData.newticket['metadata']) {
      this.componentData.newticket['metadata'][this.index].value = value.target.value;
    }
  }

}
