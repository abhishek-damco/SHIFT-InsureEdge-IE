// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Document Generation PRD §6: IEDocumentGenerator module — the sole point of contact
// with the Plumsail REST API. Exposes exactly three primitives: start job, poll job
// status, download binary. Stateless; owns no entities.
namespace InsureEdge.Application.Interfaces;

public interface IPlumsailDocumentGenerator
{
    // PRD §6.1 GenerateDoc: POST {PlumsailAPI}{UserId}/{ProcessId}/start with the merge
    // JSON; the JobId is extracted from the Location response header (base URL stripped).
    // Returns empty string when no job id could be extracted.
    Task<string> GenerateDocAsync(string json, string processId, string userId);

    // PRD §6.2 GetFileURL: GET {PlumsailAPI}{JobId}; returns Data.Link once the job has
    // finished (empty FilePath while still processing).
    Task<(string FilePath, bool Success, string Message)> GetFileUrlAsync(string jobId);

    // PRD §6.3 DownloadFile: binary GET of the file URL returned by GetFileURL.
    Task<(byte[] BinaryFile, string ContentType)> DownloadFileAsync(string path);
}
