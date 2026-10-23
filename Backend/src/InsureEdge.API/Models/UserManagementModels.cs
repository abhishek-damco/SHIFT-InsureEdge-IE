namespace InsureEdge.API.Models;

public class UserListItem
{
    public int Id { get; set; }
    public string? UserCode { get; set; }
    public string? Status { get; set; }
    public bool StatusToggle { get; set; }
    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? LastName { get; set; }
    public string? Suffix { get; set; }
    public string? Email { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public bool IsRemoteWorking { get; set; }
    public bool IsManager { get; set; }
    public string? OfficeLocation { get; set; }
    public string? Department { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? CountryCode { get; set; }
    public string? StateCode { get; set; }
    public string? City { get; set; }
    public string? County { get; set; }
    public string? ZipCode { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? TelephoneNumber { get; set; }
    public string? TelephoneNumberCc { get; set; }
    public string? AltTelephoneNumber { get; set; }
    public string? AltTelephoneNumberCc { get; set; }
    public string? Extension { get; set; }
    public string? Bio { get; set; }
    public DateTime? CreatedOn { get; set; }
    public DateTime? UpdatedOn { get; set; }
    public int? ReportsTo { get; set; }
    public string? ManagerName { get; set; }
    public string? CountryName { get; set; }
    public string? StateName { get; set; }
    public List<UserGroupRef> Groups { get; set; } = [];
}

public class UserDetail : UserListItem
{
    public List<UserPermissionRow> Permissions { get; set; } = [];
}

public class UserGroupRef
{
    public int Id { get; set; }
    public string? GroupName { get; set; }
}

public class UserPermissionRow
{
    public int ScreenId { get; set; }
    public string? ScreenCode { get; set; }
    public string? ScreenName { get; set; }
    public string? ModuleName { get; set; }
    public bool IsViewPermission { get; set; }
    public bool IsCreatePermission { get; set; }
    public bool IsEditPermission { get; set; }
    public bool IsDuplicatePermission { get; set; }
    public bool IsUploadPermission { get; set; }
    public bool IsDownloadPermission { get; set; }
    public bool IsViewSensitiveInfo { get; set; }
    public bool IsAccessSensitiveDoc { get; set; }
    public bool IsApproveReject { get; set; }
    public bool AllAccess { get; set; }
}

public class UserKpiResult
{
    public long Total { get; set; }
    public long Active { get; set; }
    public long Inactive { get; set; }
}

public class UserListResponse
{
    public List<UserListItem> Items { get; set; } = [];
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public long TotalUsers { get; set; }
    public long Active { get; set; }
    public long Inactive { get; set; }
}

public class CreateUserRequest
{
    public string FirstName { get; set; } = "";
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = "";
    public string? Suffix { get; set; }
    public string Email { get; set; } = "";
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public bool IsRemoteWorking { get; set; }
    public bool IsManager { get; set; }
    public string? OfficeLocation { get; set; }
    public string? Department { get; set; }
    public int? ReportsTo { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? CountryCode { get; set; }
    public string? StateCode { get; set; }
    public string? City { get; set; }
    public string? County { get; set; }
    public string? ZipCode { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? TelephoneNumber { get; set; }
    public string? TelephoneNumberCc { get; set; }
    public string? AltTelephoneNumber { get; set; }
    public string? AltTelephoneNumberCc { get; set; }
    public string? Extension { get; set; }
    public string? Bio { get; set; }
    public List<int> GroupIds { get; set; } = [];
    public List<UserPermissionInput> Permissions { get; set; } = [];
}

public class UpdateUserRequest : CreateUserRequest { }

public class UserPermissionInput
{
    public int ScreenId { get; set; }
    public bool IsViewPermission { get; set; }
    public bool IsCreatePermission { get; set; }
    public bool IsEditPermission { get; set; }
    public bool IsDuplicatePermission { get; set; }
    public bool IsUploadPermission { get; set; }
    public bool IsDownloadPermission { get; set; }
    public bool IsViewSensitiveInfo { get; set; }
    public bool IsAccessSensitiveDoc { get; set; }
    public bool IsApproveReject { get; set; }
    public bool AllAccess { get; set; }
}

public class UserStatusUpdateRequest
{
    public string Status { get; set; } = "";
}

public class ReferenceCountryRow
{
    public string? Code { get; set; }
    public string? Name { get; set; }
    public string? CountryDialCode { get; set; }
}

public class ReferenceStateRow
{
    public string? Code { get; set; }
    public string? Name { get; set; }
    public string? Abbreviation { get; set; }
}

public class ReferenceGroupRow
{
    public int Id { get; set; }
    public string? GroupCode { get; set; }
    public string? GroupName { get; set; }
}

public class ReferenceModuleRow
{
    public int Id { get; set; }
    public string? ModuleName { get; set; }
    public List<ReferenceScreenRow> Screens { get; set; } = [];
}

public class ReferenceScreenRow
{
    public int Id { get; set; }
    public string? ScreenCode { get; set; }
    public string? ScreenName { get; set; }
    public int ModuleId { get; set; }
}

public class ReferenceManagerRow
{
    public int Id { get; set; }
    public string? UserCode { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
}

public class ReferenceOptionRow
{
    public string Value { get; set; } = "";
    public string Label { get; set; } = "";
}
