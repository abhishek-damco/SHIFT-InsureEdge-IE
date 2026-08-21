using InsureEdge.Application.DTOs.Task;
using InsureEdge.Application.Interfaces;

namespace InsureEdge.Application.Services;

public class TaskService
{
    private readonly ITaskRepository _repo;
    private readonly ICurrentTenantService _tenant;

    public TaskService(ITaskRepository repo, ICurrentTenantService tenant)
    {
        _repo = repo;
        _tenant = tenant;
    }

    public Task<List<TaskListItemDto>> GetTasksByTypeAsync(long claimId, string taskType)
        => _repo.GetTasksByTypeAsync(claimId, taskType, _tenant.ClientId);

    public Task<TaskTypeCountDto> GetTaskCountsAsync(long claimId)
        => _repo.GetTaskCountsAsync(claimId, _tenant.ClientId);

    public Task<List<TaskAssigneeDto>> GetAssigneesAsync()
        => _repo.GetAssigneesAsync(_tenant.ClientId);

    public Task<TaskDetailDto?> GetTaskDetailAsync(long taskId)
        => _repo.GetTaskDetailAsync(taskId, _tenant.ClientId);

    public Task<List<TaskTimelineDto>> GetTimelineAsync(long claimId)
        => _repo.GetTimelineAsync(claimId, _tenant.ClientId);

    public Task<long> CreateOrUpdateAsync(CreateOrUpdateTaskRequest req)
        => _repo.CreateOrUpdateAsync(req, _tenant.ClientId, _tenant.UserId);

    public Task<TaskDocumentDto> AddDocumentAsync(long taskId, TaskDocumentUploadRequest req)
        => _repo.AddDocumentAsync(taskId, req, _tenant.ClientId, _tenant.UserId);

    public Task<TaskDocumentFileDto?> GetDocumentFileAsync(long taskId, long documentId)
        => _repo.GetDocumentFileAsync(taskId, documentId, _tenant.ClientId);
}
