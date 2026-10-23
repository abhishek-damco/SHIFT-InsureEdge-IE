using InsureEdge.Application.DTOs.Task;

namespace InsureEdge.Application.Interfaces;

public interface ITaskRepository
{
    // Get_TaskTypeListing_CS / Get_TasksListing_CS: tasks for one claim filtered by type
    Task<List<TaskListItemDto>> GetTasksByTypeAsync(long claimId, string taskType, long clientId);

    // Get_TaskListingCount: count by task type for a claim
    Task<TaskTypeCountDto> GetTaskCountsAsync(long claimId, long clientId);

    // Get_TaskAssigneeList: claims-group users + adjusters
    Task<List<TaskAssigneeDto>> GetAssigneesAsync(long clientId);

    // Get_TaskDetailsByTaskId
    Task<TaskDetailDto?> GetTaskDetailAsync(long taskId, long clientId);

    // Get_ClaimTaskTimeLine_Service: timeline for a claim's tasks
    Task<List<TaskTimelineDto>> GetTimelineAsync(long claimId, long clientId);

    // ClaimTask_CreateOrUpdate_Service / ClaimTaskandDocuments_CreateOrUpdate_Service
    Task<long> CreateOrUpdateAsync(CreateOrUpdateTaskRequest req, long clientId, long userId);

    // Task document upload
    Task<TaskDocumentDto> AddDocumentAsync(long taskId, TaskDocumentUploadRequest req, long clientId, long userId);

    // Task document file download
    Task<TaskDocumentFileDto?> GetDocumentFileAsync(long taskId, long documentId, long clientId);
}
