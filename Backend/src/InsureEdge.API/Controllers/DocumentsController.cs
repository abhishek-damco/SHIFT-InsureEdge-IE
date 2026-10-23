// Standalone document view/download by id, used by the Client Documents tab's
// preview modal and download button (routes referenced directly as <a href>/<iframe src>,
// not through the submission-scoped /submissions/{id}/documents/generated route).
using InsureEdge.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsureEdge.API.Controllers;

[ApiController]
[Route("api/documents")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentGenerationService _docs;

    public DocumentsController(IDocumentGenerationService docs) => _docs = docs;

    [HttpGet("{id:long}/view")]
    public async Task<IActionResult> View(long id)
    {
        var file = await _docs.GetDocumentBinaryByIdAsync(id);
        if (file == null) return NotFound();
        return File(file.Value.Bytes, file.Value.ContentType);
    }

    [HttpGet("{id:long}/download")]
    public async Task<IActionResult> Download(long id)
    {
        var file = await _docs.GetDocumentBinaryByIdAsync(id);
        if (file == null) return NotFound();
        return File(file.Value.Bytes, file.Value.ContentType, file.Value.FileName);
    }
}
