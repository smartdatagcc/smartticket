import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ComponentDataService } from 'src/app/services/ComponentData-Service/component-data.service';
import { ControlTemplateDataModel } from 'src/app/model/control-template-data-model';
import { ThemePalette } from '@angular/material/core';

@Component({
  selector: 'app-toggle',
  templateUrl: './toggle.component.html',
  styleUrls: ['./toggle.component.scss']
})
export class ToggleComponent implements OnInit {

  constructor(private componentData: ComponentDataService) { }

  // Declaring the Input variables
  @Input() index: number;
  @Input() control: ControlTemplateDataModel;
  @Output() notifyChanged = new EventEmitter<boolean>();
  @Input() isChecked = false;
  @Input() isDisabled = false;
  color: ThemePalette = 'primary';

  ngOnInit(): void {
  }
  // onChange event
  // update the selected values into the service object
  onChange(toggleStatus) {
    this.notifyChanged.emit(toggleStatus.checked);
  }

}