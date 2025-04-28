import { Component, OnInit, Input, Optional } from '@angular/core';
import { ComponentDataService } from 'src/app/services/ComponentData-Service/component-data.service';
import { ControlTemplateDataModel } from 'src/app/model/control-template-data-model';
import { EditorChangeContent } from 'ngx-quill';
import { ControlContainer, NgForm } from '@angular/forms';
@Component({
  selector: 'app-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class TextareaComponent implements OnInit {
  tinyMceConfig: any;

  // Declaring the Input variables
  @Input() index: number;
  @Input() control: ControlTemplateDataModel;
  @Input() formsubmitted: boolean;
  dhtml: any;

  constructor(private componentData: ComponentDataService, @Optional() private ngForm: NgForm) { }
  ngOnInit(): void {
    this.dhtml = this.control.value;
    this.configureTinyMce();
  }
  configureTinyMce() {
    const _this = this;
    this.tinyMceConfig = {
      menubar: false,
      height: 200,
      paste_data_images: true,
      setup(editor) {
        editor.on('keyup', function (e) {
          const finalcontent = e.target.innerHTML;
          _this.getcontent(finalcontent);
        });
      },
      plugins: ['advlist autolink lists link image charmap print',
        'preview anchor searchreplace visualblocks code',
        'fullscreen insertdatetime media table paste',
        'help wordcount'],
      toolbar: ' bold | italic | Underline | strikethrough | link | removeformat'
    };
  }

  changedEditor(event: EditorChangeContent) {
    if (this.componentData && this.componentData.newticket && this.componentData.newticket['metadata']) {
      this.componentData.newticket['metadata'][this.index].value = event["html"];
    }
  }

  getcontent(content) {
    const count = content.replace(/(<([^>]+)>)/ig, '');
    if (count.length >= 5000) {
      this.ngForm.form.controls[this.control.name + '_' + this.index].setErrors({ invalid: true });
    } else {
      this.ngForm.form.controls[this.control.name + '_' + this.index].setErrors(null);
    }
  }

}
