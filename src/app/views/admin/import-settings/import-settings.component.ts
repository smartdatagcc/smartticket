import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { TenantServiceService } from 'src/app/services/tenant-service/tenant-service.service';
import { LookupServiceService } from 'src/app/services/lookup-service/lookup-service.service';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/services/authentication/auth.service';
import { ControlsServiceService } from 'src/app/services/controls-service/controls-service.service';
import { ToastrnotificationService } from 'src/app/services/toastrnotification-service/toastrnotification.service';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from 'src/app/services/user-service/user.service';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-import-settings',
    templateUrl: './import-settings.component.html',
    styleUrls: ['./import-settings.component.scss']
})
export class ImportSettingsComponent implements OnInit {
    @ViewChild('inputFile') myInputVariable: ElementRef;

    constructor(private lookupService: LookupServiceService, private route: ActivatedRoute, public dialog: MatDialog,
        private authService: AuthService, public controlsService: ControlsServiceService, private userService: UserService,
        private tenantService: TenantServiceService, private notifyService: ToastrnotificationService,
        private titleService: Title) { }
    tenantId: any;
    token: any;
    su: any;
    lookupData: any;
    clearExisting = false;
    metadata: any;
    results: any[] = [];
    file: any;
    color: ThemePalette = 'primary';
    example: any = {
        statusTypes: [
            {
                name: 'Open',
                workflowActionName: 'Open',
                color: '#F39C12'
            },
            {
                name: 'Closed',
                workflowActionName: 'Close',
                color: '#27AE60'
            },
            {
                name: 'In Process',
                workflowActionName: 'In Process',
                color: '#666'
            }
        ],
        userTemplate: [
            {
                name: 'textField',
                type: 'text',
                label: 'textField',
                required: false,
                adminOnly: false
            }
        ],
        roles: [
            {
                name: 'Admin',
                default: false,
                permissions: {
                    CanEditNotes: true,
                    CanViewNotes: true,
                    CanManageTickets: true,
                    CanViewAdminPages: true
                }
            },
            {
                name: 'Support',
                default: false,
                permissions: {
                    CanEditNotes: false,
                    CanViewNotes: true,
                    CanManageTickets: true,
                    CanViewAdminPages: false
                }
            },
            {
                name: 'User',
                default: true,
                permissions: {
                    CanEditNotes: false,
                    CanViewNotes: false,
                    CanManageTickets: false,
                    CanViewAdminPages: false
                }
            }
        ],
        tenantSettings: {
            modules: [
            ],
            themeColor: 'skin-blue',
            HIPAACompliant: true,
            assignableUsers: [],
            emailNotification: false,
            registrationInviteOnly: false,
            restrictRegistrationToDomain: false,
            restrictedRegistrationDomain: ''
        },
        forms: [
            {
                name: 'Incident Report',
                ticketTemplate: [
                    {
                        name: 'subject',
                        type: 'text',
                        label: 'Subject',
                        required: true,
                        adminOnly: false
                    },
                    {
                        name: 'description',
                        type: 'textarea',
                        label: 'Description',
                        required: true,
                        adminOnly: false
                    }
                ],
                statusTypes: [
                    {
                        name: 'Open',
                        isWorkflow: true
                    },

                    {
                        name: 'In Process',
                        isWorkflow: true
                    },
                    {
                        name: 'Closed',
                        isWorkflow: true
                    }
                ],
                roles: [
                    {
                        name: 'Admin',
                        isReadOnly: true,
                        canBeAssigned: true,
                        canCreateTicket: true
                    },
                    {
                        name: 'Support',
                        isReadOnly: false,
                        canBeAssigned: true,
                        canCreateTicket: true
                    },
                    {
                        name: 'User',
                        isReadOnly: false,
                        canBeAssigned: false,
                        canCreateTicket: true
                    }
                ],
                settings: {
                    icon: 'fa-laptop'
                }
            }
        ]
    };

    @ViewChild('tenantAdminForm') tenantAdminForm: any;

    CanDeactivate(): any {
        if (this.tenantAdminForm.form.dirty || this.tenantAdminForm.form.dirty) {
            return this.userService.openDialog();
        }
        else {
            return true;
        }
    }

    ngOnInit(): void {
        this.titleService.setTitle('import-settings');
        this.route.parent.params.subscribe((params) => {
            this.tenantId = params.tenantId;
        });

        const THIS = this;
        this.su = this.authService.authentication.data.su;
        this.token = 'Bearer ' + this.authService.authentication.token;
        this.lookupData = this.lookupService.lookupdata;

    }


    onFileChange(event) {
        if (event.target.files.length > 0) {
            const selected_file = event.target.files[0];
            const extension = this.getFileExtension1(selected_file.name);
            if (extension == 'json') {
                this.file = event.target.files[0];
            } else {
                this.notifyService.showErrorMessage('please select json files only', 'Error');
            }
        }
    }

    // getting file extension
    getFileExtension1(filename) {
        return (/[.]/.exec(filename)) ? /[^.]+$/.exec(filename)[0] : undefined;
    }

    download() {
        this.tenantService.download(this.tenantId).subscribe((response: any) => {
            const blob = response.blob;
            const filename = response.filename;
            if (typeof window.navigator.msSaveBlob !== 'undefined') {
                // IE workaround for "HTML7007: One or more blob URLs were revoked by closing
                // the blob for which they were created. These URLs will no longer resolve as the data backing
                // the URL has been freed."
                window.navigator.msSaveBlob(blob, filename);
            } else {
                const URL = window.URL || window.webkitURL;
                const downloadUrl = URL.createObjectURL(blob);

                if (filename) {
                    // use HTML5 a[download] attribute to specify filename
                    const a = document.createElement('a');
                    // safari doesn't support this yet
                    if (typeof a.download === 'undefined') {
                        // window.location = downloadUrl;
                    } else {
                        a.href = downloadUrl;
                        a.download = filename;
                        a.target = '_blank';
                        document.body.appendChild(a);
                        a.click();
                    }
                } else {
                    window.open(downloadUrl, '_blank');
                }
            }
        },
            error => {
                this.notifyService.showErrorMessage(error.error.message, 'Error');
            });
    }

    bulkImport(tenantAdminForm) {
        this.results = [];
        const thisRef = this;
        if (this.myInputVariable.nativeElement.value !== '') {
            this.tenantService.bulkImport(this.file, this.tenantId, this.clearExisting)
                .subscribe((result: any) => {
                    this.file = null;
                    this.myInputVariable.nativeElement.value = '';
                    this.notifyService.showSuccessMessage('Import Completed', 'Success');
                    this.tenantAdminForm.form.markAsPristine();
                },
                    error => {
                        this.file = null;
                        this.myInputVariable.nativeElement.value = '';
                        this.notifyService.showErrorMessage(error.error.message, 'Error');
                    });
        }
        else {
            this.notifyService.showErrorMessage('Choose a file to import', 'Error');
        }

    }
}
