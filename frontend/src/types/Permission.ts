export interface ScreenPermissionsDto {
  screen: string;
  view: boolean;
  add: boolean;
  edit: boolean;
  duplicate: boolean;
  upload: boolean;
  download: boolean;
  sensitiveData: boolean;
  sensitiveDocuments: boolean;
  approveReject: boolean;
}
