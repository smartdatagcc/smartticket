import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SanitizeHtmlPipe } from './sanitizeHtml/sanitize-html.pipe';

@NgModule({
  declarations: [
    SanitizeHtmlPipe
  ],
  imports: [
   
  ],
  exports: [
    SanitizeHtmlPipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PipeModuleModule { }
