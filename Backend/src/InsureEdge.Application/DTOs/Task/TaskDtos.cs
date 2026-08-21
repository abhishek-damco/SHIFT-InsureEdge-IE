namespace InsureEdge.Application.DTOs.Task;

// ─── Kanban list item ────────────────────────────────────────────────────────

public record TaskListItemDto(
    long Id,
    string TaskCode,
    string? TaskType,
    string? TaskHeading,
    string? TaskPriority,
    string Status,
    string? TaskDueDate,
    long? AssignedTo,
    string? AssigneeUserName
);

// ─── Kanban count (tabs) ─────────────────────────────────────────────────────

public record TaskTypeCountDto(
    int ClaimEscalation,
    int RiskSurvey,
    int Underwriting,
    int CustomerService,
    int LegalCompliance,
    int FraudSiu
);

// ─── Assignee list ───────────────────────────────────────────────────────────

public record TaskAssigneeDto(
    long Id,
    string FullName,
    string Initials
);

// ─── Full task detail ────────────────────────────────────────────────────────

public record TaskDetailDto(
    long Id,
    long ClaimId,
    string TaskCode,
    string? TaskType,
    string? TaskHeading,
    string? TaskDescription,
    string Status,
    string? TaskPriority,
    string? TaskDueDate,
    string? CompletionDate,
    string? FollowUpDate,
    long? AssignedTo,
    string? AssigneeUserName,
    string? Comments,
    string CreatedOn,
    List<TaskDocumentDto> Documents
);

// ─── Task document ───────────────────────────────────────────────────────────

public record TaskDocumentDto(
    long Id,
    string FileName,
    string? ContentType,
    long? FileSize,
    string CreatedOn
);

// ─── Timeline entry ──────────────────────────────────────────────────────────

public record TaskTimelineDto(
    long Id,
    string Date,
    string ActivityType,
    string TransactionId,
    string UpdatedBy,
    string Description,
    string Timestamp
);

// ─── Create / Update request ─────────────────────────────────────────────────

public record CreateOrUpdateTaskRequest(
    long? Id,
    long ClaimId,
    string? TaskType,
    string? TaskHeading,
    string? TaskDescription,
    string? TaskPriority,
    string? TaskDueDate,
    string? CompletionDate,
    string? FollowUpDate,
    long? AssignedTo,
    string? Comments,
    string? Status
);

public record TaskDocumentUploadRequest(
    string FileName,
    string? ContentType,
    long? FileSize,
    string? FileContentBase64
);

public record TaskDocumentFileDto(
    long Id,
    string FileName,
    string? ContentType,
    byte[]? Content
);
