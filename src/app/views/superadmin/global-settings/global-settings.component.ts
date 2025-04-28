import { Component, OnInit } from '@angular/core';
import { SuServiceService } from 'src/app/services/su-service/su-service.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatAccordion } from '@angular/material/expansion';
import { ViewChild } from '@angular/core';
import { Input } from '@angular/core';
import { JsonEditorOptions } from 'src/app/jsoneditor/jsoneditor.component';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';

@Component({
  selector: 'app-global-settings',
  templateUrl: './global-settings.component.html',
  styleUrls: ['./global-settings.component.scss']
})

export class GlobalSettingsComponent implements OnInit {
  @ViewChild(MatAccordion) accordion: MatAccordion;
  @Input() multi: true;
  public editorOptions: JsonEditorOptions;
  public settings;
  public displaySettings: boolean;

  constructor(private suservice: SuServiceService, private spinner: NgxSpinnerService, private tosterService: ToastrnotificationService) {
    this.editorOptions = new JsonEditorOptions()
    this.editorOptions.onError = (e) => {
      console.log(e.toString());
    };
    this.editorOptions.modes = ['tree'];
  }

  ngOnInit(): void {
    this.displaySettings = false;
  }

  onCodeEnter(event: any) {
    if (event.target.value == '2274') {
      this.spinner.show();
      this.suservice.getAllSettings().subscribe(settingsList => {
        this.settings = settingsList;
        this.spinner.hide();
        this.displaySettings = true;
      });
    } else {
      this.displaySettings = false;
    }
  }

  typeOf(value: any) {
      return typeof value;
  }

  saveSettings(setting){
    this.suservice.updateSetting(setting).subscribe((res) => {
      this.tosterService.showSuccessMessage('Settings successfully updated', 'Success');
    });
  }
}