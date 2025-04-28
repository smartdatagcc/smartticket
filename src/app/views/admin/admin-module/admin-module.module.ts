import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PendingUsersComponent } from '../manage-users/pending-users/pending-users.component';
import { CurrentUsersComponent } from '../manage-users/current-users/current-users.component';
import { UserMetadataControlsComponent } from '../user-metadata-controls/user-metadata-controls.component';
import { MetadataControlsComponent } from '../metadata-controls/metadata-controls.component';
import { AgGridModule } from 'ag-grid-angular';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { AdminWorkflowComponent } from '../admin-workflow/admin-workflow.component';
import { FormMetadataControlsComponent } from '../form-metadata-controls/form-metadata-controls.component';
import { FormFieldMetadataControlsComponent } from '../form-field-metadata-controls/form-field-metadata-controls.component';
import { ResponseMetadataControlsComponent } from '../admin-response-template/response-metadata-controls/response-metadata-controls.component';
import { AdminResponseTemplateComponent } from '../admin-response-template/admin-response-template.component';
import { ImportTicketsComponent } from '../import-tickets/import-tickets.component';
import { AdminCustomReportComponent } from '../admin-custom-report/admin-custom-report.component';
import { CreateFormComponent } from '../manage-forms/create-form/create-form.component';
import { ImportUsersComponent } from '../import-users/import-users.component';
import {  MatTabsModule } from '@angular/material/tabs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AngularMaterialModule } from 'src/app/feature-modules/angular-material.module';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ImportSettingsComponent } from '../import-settings/import-settings.component';
import { AdminApiComponent } from '../admin-api/admin-api.component';
import { DocumentationComponent } from '../admin-api/documentation/documentation.component';
import { EditorModule } from '@tinymce/tinymce-angular';
import { RouterModule } from '@angular/router';
import { PipeModuleModule } from 'src/app/pipes/pipe.module';
import { NgxTrimDirectiveModule } from 'ngx-trim-directive';

@NgModule({
  declarations: [
    PendingUsersComponent,
    CurrentUsersComponent,
    UserMetadataControlsComponent,
    MetadataControlsComponent,
    FormMetadataControlsComponent,
    FormFieldMetadataControlsComponent,
    AdminWorkflowComponent,
    AdminResponseTemplateComponent,
    CreateFormComponent,
    ResponseMetadataControlsComponent,
    ImportTicketsComponent,
    AdminCustomReportComponent,
    ImportUsersComponent,
    ResponseMetadataControlsComponent,
    ImportSettingsComponent,
    AdminApiComponent,
    DocumentationComponent,
  ],
  imports: [
    FormsModule,
    CommonModule,
    NgxSpinnerModule,
    AgGridModule.withComponents([]),
    DragDropModule,
    MatSlideToggleModule,
    MatAutocompleteModule,
    MatTabsModule,
    PipeModuleModule,
    BrowserAnimationsModule,
    AngularMaterialModule,
    EditorModule,
    RouterModule,
    NgxTrimDirectiveModule
  ],
  exports: [
    PendingUsersComponent,
    CurrentUsersComponent,
    UserMetadataControlsComponent,
    MetadataControlsComponent,
    MatSlideToggleModule,
    AdminWorkflowComponent,
    AdminResponseTemplateComponent,
    FormMetadataControlsComponent,
    ResponseMetadataControlsComponent,
    ImportTicketsComponent,
    ImportUsersComponent,
    AdminApiComponent,
    DocumentationComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AdminModuleModule { }
