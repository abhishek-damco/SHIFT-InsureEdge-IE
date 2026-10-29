using InsureEdge.Application.DTOs.Task;
using InsureEdge.Application.Interfaces;
using InsureEdge.Domain.Entities;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InsureEdge.Infrastructure.Repositories;

public class TaskRepository : ITaskRepository
{
    private readonly InsureEdgeDbContext _db;

    public TaskRepository(InsureEdgeDbContext db) => _db = db;

    // ─── Get_TaskTypeListing_CS / Get_TasksListing_CS ────────────────────────
    // Returns all tasks for a claim filtered by task type, with AssigneeUserName resolved.

    public async Task<List<TaskListItemDto>> GetTasksByTypeAsync(long claimId, string taskType, long clientId)
    {
        var tasks = await _db.ClaimTasks
            .Where(t => t.ClaimId == claimId && t.ClientId == clientId && t.TaskType == taskType)
            .Include(t => t.AssignedToUser)
            .OrderByDescending(t => t.Id)
            .ToListAsync();

        return tasks.Select(t => new TaskListItemDto(
            t.Id, t.TaskCode, t.TaskType, t.TaskHeading, t.TaskPriority, t.Status,
            t.TaskDueDate.HasValue ? t.TaskDueDate.Value.ToString("MM-dd-yyyy") : null,
            t.AssignedTo,
            t.AssignedToUser != null ? t.AssignedToUser.FullName : null
        )).ToList();
    }

    // ─── Get_TaskListingCount ─────────────────────────────────────────────────
    // Counts tasks per task type for a claim (drives tab counts).

    public async Task<TaskTypeCountDto> GetTaskCountsAsync(long claimId, long clientId)
    {
        var counts = await _db.ClaimTasks
            .Where(t => t.ClaimId == claimId && t.ClientId == clientId)
            .GroupBy(t => t.TaskType)
            .Select(g => new { TaskType = g.Key, Count = g.Count() })
            .ToListAsync();

        int get(string key) => counts.FirstOrDefault(c => c.TaskType == key)?.Count ?? 0;

        return new TaskTypeCountDto(
            get("Claim Escalation"),
            get("Risk Survey"),
            get("Underwriting"),
            get("Customer Service"),
            get("Legal & Compliance"),
            get("Fraud SIU")
        );
    }

    // ─── Get_TaskAssigneeList ─────────────────────────────────────────────────
    // Returns claims-group users + adjuster users for this client.

    public async Task<List<TaskAssigneeDto>> GetAssigneesAsync(long clientId)
    {
        // Claims group members
        var claimsGroupUserIds = await _db.Groups
            .Where(g => g.ClientId == clientId && g.GroupName.Contains("Claims"))
            .SelectMany(g => g.GroupUsers)
            .Select(gu => gu.UserId)
            .Distinct()
            .ToListAsync();

        var allUserIds = claimsGroupUserIds.Distinct().ToList();

        // If no Claims group found, fall back to all active users for the client
        if (allUserIds.Count == 0)
        {
            var users = await _db.Users
                .Where(u => u.ClientId == clientId && u.IsActive)
                .OrderBy(u => u.FirstName).ThenBy(u => u.LastName)
                .ToListAsync();
            return users.Select(u => new TaskAssigneeDto(u.Id, u.FullName, u.Initials)).ToList();
        }

        var groupUsers = await _db.Users
            .Where(u => allUserIds.Contains(u.Id) && u.IsActive)
            .OrderBy(u => u.FirstName).ThenBy(u => u.LastName)
            .ToListAsync();
        return groupUsers.Select(u => new TaskAssigneeDto(u.Id, u.FullName, u.Initials)).ToList();
    }

    // ─── Get_TaskDetailsByTaskId ──────────────────────────────────────────────

    public async Task<TaskDetailDto?> GetTaskDetailAsync(long taskId, long clientId)
    {
        var t = await _db.ClaimTasks
            .Where(t => t.Id == taskId && t.ClientId == clientId)
            .Include(t => t.AssignedToUser)
            .Include(t => t.Documents)
            .FirstOrDefaultAsync();

        if (t == null) return null;

        var docDtos = t.Documents
            .OrderByDescending(d => d.Id)
            .Select(d => new TaskDocumentDto(d.Id, d.FileName, d.ContentType, d.FileSize, d.CreatedOn.ToString("MM-dd-yyyy")))
            .ToList();

        return new TaskDetailDto(
            t.Id, t.ClaimId, t.TaskCode, t.TaskType, t.TaskHeading, t.TaskDescription,
            t.Status, t.TaskPriority,
            t.TaskDueDate.HasValue ? t.TaskDueDate.Value.ToString("MM-dd-yyyy") : null,
            t.CompletionDate.HasValue ? t.CompletionDate.Value.ToString("MM-dd-yyyy") : null,
            t.FollowUpDate.HasValue ? t.FollowUpDate.Value.ToString("MM-dd-yyyy") : null,
            t.AssignedTo,
            t.AssignedToUser?.FullName,
            t.Comments,
            t.CreatedOn.ToString("MM-dd-yyyy"),
            docDtos
        );
    }

    // ─── Get_ClaimTaskTimeLine_Service ────────────────────────────────────────
    // Builds timeline from audit logs across all tasks for a claim.

    public async Task<List<TaskTimelineDto>> GetTimelineAsync(long claimId, long clientId)
    {
        var logs = await _db.ClaimTaskAuditLogs
            .Where(l => l.ClaimId == claimId && l.ClientId == clientId)
            .Include(l => l.User)
            .OrderBy(l => l.Id)
            .ToListAsync();

        return logs.Select((l, idx) => new TaskTimelineDto(
            l.Id,
            l.CreatedOn.ToString("MM/dd/yyyy"),
            l.ActivityType ?? "Task Activity",
            $"{l.Id:D7}",
            l.User != null ? l.User.FullName : "-",
            l.Description ?? "-",
            l.CreatedOn.ToString("MM/dd/yyyy, hh:mm tt")
        )).ToList();
    }

    // ─── ClaimTask_CreateOrUpdate_Service ─────────────────────────────────────

    public async Task<long> CreateOrUpdateAsync(CreateOrUpdateTaskRequest req, long clientId, long userId)
    {
        DateTimeOffset? ParseDate(string? s) =>
            DateTimeOffset.TryParse(s, out var d) ? d : null;

        if (req.Id.HasValue && req.Id.Value > 0)
        {
            var existing = await _db.ClaimTasks
                .FirstOrDefaultAsync(t => t.Id == req.Id.Value && t.ClientId == clientId)
                ?? throw new InvalidOperationException("Task not found.");

            var oldStatus = existing.Status;
            existing.TaskType        = req.TaskType;
            existing.TaskHeading     = req.TaskHeading;
            existing.TaskDescription = req.TaskDescription;
            existing.TaskPriority    = req.TaskPriority;
            existing.TaskDueDate     = ParseDate(req.TaskDueDate);
            existing.CompletionDate  = ParseDate(req.CompletionDate);
            existing.FollowUpDate    = ParseDate(req.FollowUpDate);
            existing.AssignedTo      = req.AssignedTo;
            existing.Comments        = req.Comments;
            if (!string.IsNullOrWhiteSpace(req.Status))
                existing.Status = req.Status;
            existing.UpdatedBy = userId;
            existing.UpdatedOn = DateTimeOffset.UtcNow;

            if (oldStatus != existing.Status)
            {
                _db.ClaimTaskAuditLogs.Add(new ClaimTaskAuditLog
                {
                    ClaimTaskId  = existing.Id,
                    ClaimId      = existing.ClaimId,
                    ClientId     = clientId,
                    ActivityType = "Task Status Updated",
                    Description  = $"Task status changed from {oldStatus} to {existing.Status}",
                    UserId       = userId,
                    CreatedOn    = DateTimeOffset.UtcNow
                });
            }

            await _db.SaveChangesAsync();
            return existing.Id;
        }
        else
        {
            var count = await _db.ClaimTasks.CountAsync(t => t.ClientId == clientId) + 1;
            var task = new ClaimTask
            {
                ClaimId         = req.ClaimId,
                ClientId        = clientId,
                TaskCode        = $"TASK-{count:D4}",
                TaskType        = req.TaskType,
                TaskHeading     = req.TaskHeading,
                TaskDescription = req.TaskDescription,
                Status          = req.Status ?? "New",
                TaskPriority    = req.TaskPriority,
                TaskDueDate     = ParseDate(req.TaskDueDate),
                CompletionDate  = ParseDate(req.CompletionDate),
                FollowUpDate    = ParseDate(req.FollowUpDate),
                AssignedTo      = req.AssignedTo,
                Comments        = req.Comments,
                CreatedBy       = userId,
                CreatedOn       = DateTimeOffset.UtcNow
            };

            _db.ClaimTasks.Add(task);
            await _db.SaveChangesAsync();

            _db.ClaimTaskAuditLogs.Add(new ClaimTaskAuditLog
            {
                ClaimTaskId  = task.Id,
                ClaimId      = task.ClaimId,
                ClientId     = clientId,
                ActivityType = "Task Created",
                Description  = $"New task {task.TaskCode} created: {task.TaskHeading}",
                UserId       = userId,
                CreatedOn    = DateTimeOffset.UtcNow
            });

            await _db.SaveChangesAsync();
            return task.Id;
        }
    }

    // ─── Task Document ────────────────────────────────────────────────────────

    public async Task<TaskDocumentDto> AddDocumentAsync(long taskId, TaskDocumentUploadRequest req, long clientId, long userId)
    {
        var task = await _db.ClaimTasks
            .FirstOrDefaultAsync(t => t.Id == taskId && t.ClientId == clientId)
            ?? throw new InvalidOperationException("Task not found.");

        byte[]? content = null;
        if (!string.IsNullOrWhiteSpace(req.FileContentBase64))
            content = Convert.FromBase64String(req.FileContentBase64);

        var doc = new ClaimTaskDocument
        {
            ClaimTaskId = taskId,
            ClientId    = clientId,
            FileName    = req.FileName,
            ContentType = req.ContentType,
            FileSize    = req.FileSize,
            FileContent = content,
            CreatedBy   = userId,
            CreatedOn   = DateTimeOffset.UtcNow
        };

        _db.ClaimTaskDocuments.Add(doc);

        _db.ClaimTaskAuditLogs.Add(new ClaimTaskAuditLog
        {
            ClaimTaskId  = taskId,
            ClaimId      = task.ClaimId,
            ClientId     = clientId,
            ActivityType = "Document Uploaded",
            Description  = $"Document {req.FileName} uploaded to task {task.TaskCode}",
            UserId       = userId,
            CreatedOn    = DateTimeOffset.UtcNow
        });

        await _db.SaveChangesAsync();
        return new TaskDocumentDto(doc.Id, doc.FileName, doc.ContentType, doc.FileSize, doc.CreatedOn.ToString("MM-dd-yyyy"));
    }

    public async Task<TaskDocumentFileDto?> GetDocumentFileAsync(long taskId, long documentId, long clientId)
    {
        var doc = await _db.ClaimTaskDocuments
            .FirstOrDefaultAsync(d => d.Id == documentId && d.ClaimTaskId == taskId && d.ClientId == clientId);

        if (doc == null) return null;
        return new TaskDocumentFileDto(doc.Id, doc.FileName, doc.ContentType, doc.FileContent);
    }
}
