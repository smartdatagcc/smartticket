
import { Component, OnInit, Input } from '@angular/core';
import { ComponentDataService } from 'src/app/services/ComponentData-Service/component-data.service';
import { ControlTemplateDataModel } from 'src/app/model/control-template-data-model';


@Component({
  selector: 'app-label',
  templateUrl: './label.component.html',
  styleUrls: ['./label.component.scss']
})
export class LabelComponent implements OnInit {

  // Declaring the Input variables
  @Input() index: number;
  @Input() control: ControlTemplateDataModel;

  constructor(private componentData: ComponentDataService) { }

  ngOnInit(): void {
    if (this.control.value === undefined){
        if (this.control.content !== null && this.control.content !== undefined ){
          this.control.value =  this.control.content;
        }else{
          this.control.value = '';
        }
    }
    if(this.control.content === undefined){
      this.control.content = this.control.value;
    }
  }
}
