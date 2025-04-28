import { CommonModule } from '@angular/common';
import { CustomHeaderComponent } from './views/tickets/tickets/custom-header/custom-header.component';
import { BrowserModule, Title } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LandingpageComponent } from './landingpage/landingpage.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthService } from './services/authentication/auth.service';
import { HeaderComponent } from './common/header/header.component';
import { FooterComponent } from './common/footer/footer.component';
import { SideBarComponent } from './common/side-bar/side-bar.component';
import { LookupServiceService } from './services/lookup-service/lookup-service.service';
import { TokenInterceptorService } from './services/token-interceptor/token-interceptor.service';
import { FormslistComponent } from './dashboard/formslist/formslist.component';
import { SupportTicketServiceService } from './services/support-ticket-service/support-ticket-service.service';
import { EmailComponent } from './common/control-templates/email/email.component';
import { CheckboxlistComponent } from './common/control-templates/checkboxlist/checkboxlist.component';
import { ComponentDataService } from 'src/app/services/ComponentData-Service/component-data.service';
import { TextComponent } from './common/control-templates/text/text.component';
import { PhonenumberComponent } from './common/control-templates/phonenumber/phonenumber.component';
import { RadiobuttonlistComponent } from './common/control-templates/radiobuttonlist/radiobuttonlist.component';
import { SelectComponent } from './common/control-templates/select/select.component';
import { TextareaComponent } from './common/control-templates/textarea/textarea.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DatepickerComponent } from './common/control-templates/datepicker/datepicker.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AccountServiceService } from './services/account-service/account-service.service';
import { DateAgoPipe } from './pipes/dateAgo/date-ago.pipe';
import { NotFoundComponent } from './not-found/not-found.component';
import { ToggleComponent } from './common/control-templates/toggle/toggle.component';
import { AngularMaterialModule } from './feature-modules/angular-material.module';
import { ConfirmDialogComponent } from './common/control-templates/confirm-dialog/confirm-dialog.component';
import { UserService } from './services/user-service/user.service';
import { ProfileComponent } from './profile/profile.component';
import { ChangePasswordComponent } from './profile/change-password/change-password.component';
import { SignaturePadComponent } from './common/control-templates/signature-pad/signature-pad.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrModule } from 'ngx-toastr';
import { ToastrnotificationService } from './services/toastrnotification-service/toastrnotification.service';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { TimepickerComponent } from './common/control-templates/timepicker/timepicker.component';
import { LoginComponent } from './authentication/login/login.component';
import { ResetPasswordComponent } from './authentication/reset-password/reset-password.component';
import { SuDashboardComponent } from './views/superadmin/su-dashboard/su-dashboard.component';
import { MatTabsModule } from '@angular/material/tabs';
import { SuHeaderComponent } from './views/superadmin/su-header/su-header.component';
import { TenantsComponent } from './views/superadmin/tenants/tenants.component';
import { NewslettersComponent } from './views/superadmin/newsletters/newsletters.component';
import { SuperUsersComponent } from './views/superadmin/super-users/super-users.component';
import { GlobalSettingsComponent } from './views/superadmin/global-settings/global-settings.component';
import { LogsComponent } from './views/superadmin/logs/logs.component';
import { AgGridModule } from 'ag-grid-angular';
import { GridRowSelectService } from './services/grid-row-select-service/grid-row-select.service';
import { TransformDatePipe } from './pipes/transform-date/transform-date.pipe';
import { TransformAgePipe } from './pipes/transform-age/transform-age.pipe';
import { TicketsComponent } from './views/tickets/tickets/tickets.component';
import { ControlsServiceService } from './services/controls-service/controls-service.service';
import { UserProfileDialogComponent } from './views/tickets/user-profile-dialog/user-profile-dialog.component';
import { AdminSidebarComponent } from './views/admin/admin-sidebar/admin-sidebar.component';
import { AdminSettingsComponent } from './views/admin/admin-settings/admin-settings.component';
import { ManageUsersComponent } from './views/admin/manage-users/manage-users.component';
import { AdminSettingsDashboardComponent } from './views/admin/admin-settings-dashboard/admin-settings-dashboard.component';
import { EditTenantComponent } from './views/modals/edit-tenant/edit-tenant.component';
import { AddTenantComponent } from './views/modals/add-tenant/add-tenant.component';
import { LabelComponent } from './common/control-templates/label/label.component';
import { RegistrationComponent } from './authentication/registration/registration.component';
import { WorkspaceSettingsComponent } from './views/admin/workspace-settings/workspace-settings.component';
import { AddUserModalComponent } from './views/admin/manage-users/add-user-modal/add-user-modal.component';
import { ConfirmEqualValidatorDirective } from './directives/confirm-equal-validator.directive';
import { LogoutComponent } from './authentication/logout/logout.component';
import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt';
import { AuthGuardService } from './services/auth-guard/auth-guard.service';
import { ScrollToModule } from '@nicky-lenaers/ngx-scroll-to';
import { ManageRolesComponent } from './views/admin/manage-roles/manage-roles.component';
import { EditRoleComponent } from './views/admin/manage-roles/edit-role/edit-role.component';
import { AddSuperUserComponent } from './views/superadmin/super-users/add-super-user/add-super-user.component';
import { ManageFormsComponent } from './views/admin/manage-forms/manage-forms.component';
import { AdminFormsComponent } from './views/admin/admin-forms/admin-forms.component';
import { AdminModuleModule } from './views/admin/admin-module/admin-module.module';
import { AddUserControlModalComponent } from './views/admin/user-metadata-controls/add-user-control-modal/add-user-control-modal.component';
import { EditControlModalComponent } from './views/admin/metadata-controls/edit-control-modal/edit-control-modal.component';
import { StatusServiceService } from './services/status-service/status-service.service';
import { ColorServiceService } from './services/color-service/color-service.service';
import { CacheServiceService} from './services/cache-service/cache-service.service';
import { FormServiceService } from './services/form-service/form-service.service';
import { WorkspaceComponent } from './views/workspace/workspace.component';
import { AddFormFieldControlModalComponent } from './views/admin/form-field-metadata-controls/add-form-field-control-modal/add-form-field-control-modal.component';
import { ColorPickerComponent } from './common/control-templates/color-picker/color-picker.component';
import { DeleteStatusModalComponent } from 'src/app/views/admin/admin-workflow/delete-status-modal/delete-status-modal.component';
import { EditStatusModalComponent } from 'src/app/views/admin/admin-workflow/edit-status-modal/edit-status-modal.component';
import { EditUserModalComponent } from 'src/app/views/admin/manage-users/edit-user-modal/edit-user-modal.component';
import { ResetUserPasswordModalComponent } from 'src/app/views/admin/manage-users/reset-user-password-modal/reset-user-password-modal.component';
import { ConfirmationModalComponent } from './views/modals/confirmation-modal/confirmation-modal.component';
import { AddResponseTemplateComponent } from './views/admin/admin-response-template/add-response-template/add-response-template.component';
import { EditResponseTemplateComponent } from './views/admin/admin-response-template/edit-response-template/edit-response-template.component';
import { CreateTicketComponent } from './views/tickets/create-ticket/create-ticket.component';
import { TicketToggleComponent } from './common/control-templates/ticket-toggle/ticket-toggle.component';
import { CreateNewRoleComponent } from './views/admin/manage-roles/create-new-role/create-new-role.component';
import { ExistingTicketComponent } from './views/tickets/existing-ticket/existing-ticket.component';
import { TicketHeaderComponent } from './common/ticket-header/ticket-header.component';
import { TicketMenuComponent } from './common/ticket-menu/ticket-menu.component';
import { TicketArchiveDialogComponent } from './views/tickets/existing-ticket/ticket-archive-dialog/ticket-archive-dialog.component';
import { CommentsNotesViewComponent } from './common/comments-notes-view/comments-notes-view.component';
import { HistoryComponent } from './views/tickets/existing-ticket/history/history.component';
import { TicketTimelineComponent } from './common/ticket-timeline/ticket-timeline.component';
import { CustomReportComponent } from './views/tickets/existing-ticket/custom-report/custom-report.component';
import { EditCustomReportComponent } from './views/tickets/existing-ticket/custom-report/edit-custom-report/edit-custom-report.component';
import { NotesComponent } from './views/tickets/existing-ticket/notes/notes.component';
import { WorkspaceChangeComponent } from './common/workspace-change/workspace-change.component';
import { CreateRequestGuardService } from './services/auth-guard/my-guard.service';
import { RequestTenantInviteDialogComponent } from './authentication/request-tenant-invite-dialog/request-tenant-invite-dialog.component';
import { EditorModule } from '@tinymce/tinymce-angular';
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { PipeModuleModule } from './pipes/pipe.module';
import { NgxTrimDirectiveModule } from 'ngx-trim-directive';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { NgJsonEditorModule } from './ng-jsoneditor/ng-jsoneditor.module';
import { TooltipComponent } from './common/tooltip-component/tooltip-component.component';

@NgModule({
  declarations: [
    AppComponent,
    LandingpageComponent,
    DashboardComponent,
    HeaderComponent,
    FooterComponent,
    SideBarComponent,
    FormslistComponent,
    EmailComponent,
    CheckboxlistComponent,
    CreateTicketComponent,
    TextComponent,
    PhonenumberComponent,
    RadiobuttonlistComponent,
    SelectComponent,
    TextareaComponent,
    DatepickerComponent,
    DateAgoPipe,
    NotFoundComponent,
    ToggleComponent,
    ConfirmDialogComponent,
    ProfileComponent,
    ChangePasswordComponent,
    SignaturePadComponent,
    TimepickerComponent,
    LoginComponent,
    ResetPasswordComponent,
    SuDashboardComponent,
    SuHeaderComponent,
    TenantsComponent,
    NewslettersComponent,
    SuperUsersComponent,
    GlobalSettingsComponent,
    LogsComponent,
    TransformDatePipe,
    TransformAgePipe,
    TicketsComponent,
    AdminSidebarComponent,
    AdminSettingsComponent,
    ManageUsersComponent,
    AdminSettingsDashboardComponent,
    EditTenantComponent,
    AddTenantComponent,
    LabelComponent,
    UserProfileDialogComponent,
    RegistrationComponent,
    WorkspaceSettingsComponent,
    AddUserModalComponent,
    ConfirmEqualValidatorDirective,
    LogoutComponent,
    ManageRolesComponent,
    EditRoleComponent,
    AddSuperUserComponent,
    ManageFormsComponent,
    AdminFormsComponent,
    AddUserControlModalComponent,
    EditControlModalComponent,
    WorkspaceComponent,
    AddFormFieldControlModalComponent,
    ColorPickerComponent,
    EditStatusModalComponent,
    DeleteStatusModalComponent,
    EditUserModalComponent,
    ResetUserPasswordModalComponent,
    ConfirmationModalComponent,
    AddResponseTemplateComponent,
    EditResponseTemplateComponent,
    CreateNewRoleComponent,
    TicketToggleComponent,
    CreateNewRoleComponent,
    ExistingTicketComponent,
    TicketHeaderComponent,
    TicketMenuComponent,
    TicketArchiveDialogComponent,
    CommentsNotesViewComponent,
    ExistingTicketComponent,
    HistoryComponent,
    TicketTimelineComponent,
    CustomReportComponent,
    EditCustomReportComponent,
    NotesComponent,
    WorkspaceChangeComponent,
    RequestTenantInviteDialogComponent,
    ClickOutsideDirective,
    CustomHeaderComponent,
    TooltipComponent,
  ],
  imports: [
    CommonModule,
    NgxTrimDirectiveModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    NgxSpinnerModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    NgxMaterialTimepickerModule,
    MatTabsModule,
    EditorModule,
    PipeModuleModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    AngularMaterialModule,
    AdminModuleModule,
    ScrollToModule.forRoot(),
    AgGridModule.withComponents([CustomHeaderComponent, TooltipComponent]),
    MatExpansionModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    NgJsonEditorModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    AuthService,
    LookupServiceService,
    SupportTicketServiceService,
    ComponentDataService,
    AccountServiceService,
    ToastrnotificationService,
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptorService, multi: true },
    UserService,
    ControlsServiceService,
    { provide: JWT_OPTIONS, useValue: JWT_OPTIONS },
    JwtHelperService,
    AuthGuardService,
    StatusServiceService,
    ColorServiceService,
    CacheServiceService,
    FormServiceService,
    CreateRequestGuardService,
    GridRowSelectService,
    Title
  ],
  exports: [
    MatSlideToggleModule,
    EditorModule,
    NgxTrimDirectiveModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
