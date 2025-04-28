import { NgModule } from '@angular/core';
import { Routes, RouterModule, CanActivate } from '@angular/router';
import { LandingpageComponent } from './landingpage/landingpage.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FormslistComponent } from './dashboard/formslist/formslist.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { ProfileComponent } from './profile/profile.component';
import { LoginComponent } from './authentication/login/login.component';
import { ResetPasswordComponent } from './authentication/reset-password/reset-password.component';
import { SuDashboardComponent } from './views/superadmin/su-dashboard/su-dashboard.component';
import { TicketsComponent } from './views/tickets/tickets/tickets.component';
import { AdminSettingsComponent } from './views/admin/admin-settings/admin-settings.component';
import { ManageUsersComponent } from './views/admin/manage-users/manage-users.component';
import { AdminSettingsDashboardComponent } from './views/admin/admin-settings-dashboard/admin-settings-dashboard.component';
import { UserMetadataControlsComponent } from './views/admin/user-metadata-controls/user-metadata-controls.component';
import { RegistrationComponent } from './authentication/registration/registration.component';
import { WorkspaceSettingsComponent } from './views/admin/workspace-settings/workspace-settings.component';
import { LogoutComponent } from './authentication/logout/logout.component';
import { AuthGuardService as AuthGuard } from './services/auth-guard/auth-guard.service';
import { ManageRolesComponent } from './views/admin/manage-roles/manage-roles.component';
import { EditRoleComponent } from './views/admin/manage-roles/edit-role/edit-role.component';
import { ManageFormsComponent } from './views/admin/manage-forms/manage-forms.component';
import { AdminFormsComponent } from './views/admin/admin-forms/admin-forms.component';
import { AdminWorkflowComponent } from './views/admin/admin-workflow/admin-workflow.component';
import { WorkspaceComponent } from './views/workspace/workspace.component';
import { FormFieldMetadataControlsComponent } from './views/admin/form-field-metadata-controls/form-field-metadata-controls.component';
import { AdminResponseTemplateComponent } from './views/admin/admin-response-template/admin-response-template.component';
import { CreateTicketComponent } from './views/tickets/create-ticket/create-ticket.component';
import { CreateNewRoleComponent } from './views/admin/manage-roles/create-new-role/create-new-role.component';
import { AdminCustomReportComponent } from './views/admin/admin-custom-report/admin-custom-report.component';
import { CreateFormComponent } from './views/admin/manage-forms/create-form/create-form.component';
import { ImportTicketsComponent } from './views/admin/import-tickets/import-tickets.component';
import { ImportUsersComponent } from './views/admin/import-users/import-users.component';
import { ExistingTicketComponent } from './views/tickets/existing-ticket/existing-ticket.component';
import { ImportSettingsComponent } from './views/admin/import-settings/import-settings.component';
import { AdminApiComponent } from './views/admin/admin-api/admin-api.component';
import { HistoryComponent } from './views/tickets/existing-ticket/history/history.component';
import { CustomReportComponent } from './views/tickets/existing-ticket/custom-report/custom-report.component';
import { NotesComponent } from './views/tickets/existing-ticket/notes/notes.component';
import { CreateRequestGuardService } from './services/auth-guard/my-guard.service';


const routes: Routes = [
  { path: '', redirectTo: '/landing-page', pathMatch: 'full' },
  { path: 'landing-page', component: LandingpageComponent },
  { path: 'not-found', component: NotFoundComponent },
  { path: 'workspace', component: WorkspaceComponent },
  { path: 'reset-password/:token', component: ResetPasswordComponent },
  { path: ':tenantId/registration/:token', component: RegistrationComponent },
  { path: 'su-dashboard', component: SuDashboardComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'logout', component: LogoutComponent },
  {
    path: ':tenantId', component: DashboardComponent, canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: FormslistComponent, canActivate: [AuthGuard] },
      {
        path: 'profile', component: ProfileComponent, canActivate: [AuthGuard],
        canDeactivate: [CreateRequestGuardService]
      },
      {
        path: 'create-ticket/:formId', component: CreateTicketComponent, canActivate: [AuthGuard],
        canDeactivate: [CreateRequestGuardService]
      },
      { path: 'tickets/:formId', component: TicketsComponent, canActivate: [AuthGuard] },
      {
        path: 'ticket/:formId/:id', component: ExistingTicketComponent, canActivate: [AuthGuard],
        canDeactivate: [CreateRequestGuardService]
      },
      { path: 'ticket/:formId/:id/custom-report', component: CustomReportComponent, canActivate: [AuthGuard] },
      { path: 'ticket/:formId/:id/history', component: HistoryComponent, canActivate: [AuthGuard] },
      {
        path: 'ticket/:formId/:id/notes', component: NotesComponent, canActivate: [AuthGuard],
        canDeactivate: [CreateRequestGuardService]
      },
    ]
  },
  {
    path: ':tenantId/registration', component: RegistrationComponent
  },
  { path: ':tenantId/logout', component: LogoutComponent },
  {
    path: ':tenantId/login', component: LoginComponent,
  },
  {
    path: ':tenantId/login/:formId/:ticketId', component: LoginComponent,
  },
  {
    path: ':tenantId/admin', component: AdminSettingsDashboardComponent, canActivate: [AuthGuard],
    children: [
      {
        path: 'user-controls', component: UserMetadataControlsComponent,
        canDeactivate: [CreateRequestGuardService]
      },
      { path: 'users', component: ManageUsersComponent, canActivate: [AuthGuard] },
      { path: 'admin-form', component: AdminFormsComponent, canActivate: [AuthGuard] },
      {
        path: 'forms/:formId', component: ManageFormsComponent, canActivate: [AuthGuard],
        canDeactivate: [CreateRequestGuardService]
      },
      {
        path: 'custom-report/:formId', component: AdminCustomReportComponent, canActivate: [AuthGuard],
        canDeactivate: [CreateRequestGuardService]
      },
      {
        path: 'form/create', component: CreateFormComponent, canActivate: [AuthGuard],
        canDeactivate: [CreateRequestGuardService]
      },
      {
        path: 'controls/:formId', component: FormFieldMetadataControlsComponent, canActivate: [AuthGuard],
        canDeactivate: [CreateRequestGuardService]
      },
      { path: 'workflow/:formId', component: AdminWorkflowComponent, canActivate: [AuthGuard] },
      { path: 'response-template/:formId', component: AdminResponseTemplateComponent, canActivate: [AuthGuard] },
      { path: 'user-controls', component: UserMetadataControlsComponent, canActivate: [AuthGuard] },
      {
        path: 'settings', component: AdminSettingsComponent, canActivate: [AuthGuard],
        canDeactivate: [CreateRequestGuardService]
      },
      { path: 'roles', component: ManageRolesComponent, canActivate: [AuthGuard] },
      {
        path: 'roles/create', component: CreateNewRoleComponent, canActivate: [AuthGuard],
        canDeactivate: [CreateRequestGuardService]
      },
      {
        path: 'roles/:roleId/edit', component: EditRoleComponent, canActivate: [AuthGuard],
        canDeactivate: [CreateRequestGuardService]
      },
      {
        path: 'import-tickets', component: ImportTicketsComponent, canActivate: [AuthGuard],
        canDeactivate: [CreateRequestGuardService]
      },
      {
        path: 'import-users', component: ImportUsersComponent, canActivate: [AuthGuard],
        canDeactivate: [CreateRequestGuardService]
      },
      {
        path: 'import-settings', component: ImportSettingsComponent, canActivate: [AuthGuard],
        canDeactivate: [CreateRequestGuardService]
      },
      {
        path: 'admin-api', component: AdminApiComponent, canActivate: [AuthGuard],
        canDeactivate: [CreateRequestGuardService]
      },
      { path: 'logout', component: LogoutComponent },
      { path: '**', component: LandingpageComponent }
    ]
  },
  { path: '**', component: LandingpageComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { anchorScrolling: 'enabled' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
