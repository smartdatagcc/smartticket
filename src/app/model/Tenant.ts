export interface Tenant {
    id: number;
    tenantSettings: {
      settings: {
        restrictRegistrationToDomain: boolean,
        restrictedRegistrationDomain: string
      }
    };
  }