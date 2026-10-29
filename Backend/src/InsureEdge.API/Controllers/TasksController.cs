using InsureEdge.Application.DTOs.Task;
using InsureEdge.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/tasks")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly TaskService _tasks;

    public TasksController(TaskService tasks) => _tasks = tasks;

    // GET /api/tasks/by-claim/{claimId}?taskType=Claim+Escalation
    // Get_TaskTypeListing_CS — kanban cards for one tab
    [HttpGet("by-claim/{claimId:long}")]
    public async Task<IActionResult> GetByType(long claimId, [FromQuery] string taskType)
    {
        if (string.IsNullOrWhiteSpace(taskType)) return BadRequest("taskType is required");
        return Ok(await _tasks.GetTasksByTypeAsync(claimId, taskType));
    }

    // GET /api/tasks/by-claim/{claimId}/count
    // Get_TaskListingCount — tab badge counts
    [HttpGet("by-claim/{claimId:long}/count")]
    public async Task<IActionResult> GetCounts(long claimId)
        => Ok(await _tasks.GetTaskCountsAsync(claimId));

    // GET /api/tasks/by-claim/{claimId}/timeline
    // Get_ClaimTaskTimeLine_Service — claim task activity timeline
    [HttpGet("by-claim/{claimId:long}/timeline")]
    public async Task<IActionResult> GetTimeline(long claimId)
        => Ok(await _tasks.GetTimelineAsync(claimId));

    // GET /api/tasks/assignees — Get_TaskAssigneeList
    [HttpGet("assignees")]
    public async Task<IActionResult> GetAssignees()
        => Ok(await _tasks.GetAssigneesAsync());

    // GET /api/tasks/{taskId} — Get_TaskDetailsByTaskId
    [HttpGet("{taskId:long}")]
    public async Task<IActionResult> GetDetail(long taskId)
    {
        var result = await _tasks.GetTaskDetailAsync(taskId);
        return result == null ? NotFound() : Ok(result);
    }

    // POST /api/tasks — ClaimTask_CreateOrUpdate_Service (create)
    // PUT  /api/tasks — ClaimTask_CreateOrUpdate_Service (update)
    [HttpPost]
    public async Task<IActionResult> CreateOrUpdate([FromBody] CreateOrUpdateTaskRequest req)
    {
        var id = await _tasks.CreateOrUpdateAsync(req);
        return Ok(new { id });
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] CreateOrUpdateTaskRequest req)
    {
        var id = await _tasks.CreateOrUpdateAsync(req);
        return Ok(new { id });
    }

    // POST /api/tasks/{taskId}/documents — ClaimTaskandDocuments_CreateOrUpdate_Service
    [HttpPost("{taskId:long}/documents")]
    public async Task<IActionResult> UploadDocument(long taskId, [FromBody] TaskDocumentUploadRequest req)
    {
        var doc = await _tasks.AddDocumentAsync(taskId, req);
        return Ok(doc);
    }

    // GET /api/tasks/{taskId}/documents/{documentId} — Get_TaskDocumentByBlobPath
    [HttpGet("{taskId:long}/documents/{documentId:long}")]
    public async Task<IActionResult> GetDocumentFile(long taskId, long documentId)
    {
        var file = await _tasks.GetDocumentFileAsync(taskId, documentId);
        if (file == null) return NotFound();
        return File(file.Content ?? [], file.ContentType ?? "application/octet-stream", file.FileName);
    }
}
