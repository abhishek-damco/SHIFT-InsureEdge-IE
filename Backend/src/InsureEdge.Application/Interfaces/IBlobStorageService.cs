namespace InsureEdge.Application.Interfaces;

// Azure Blob Storage for policy/claim documents. Path + metadata convention confirmed against
// the "Domain Conceptual Diagrams" doc (2026-09-25):
//   {root}/{clientId}/{policyId}/{policyId}_{documentType}-{timestamp}.{ext}   — policy documents
//   {root}/{clientId}/Claims/{policyId}_{documentType}-{timestamp}.{ext}       — claim documents
// {root} is the environment folder (e.g. "dev") inside the shared container. Metadata common to
// every document type: DocumentType, DocumentName, UploadedDate.
public interface IBlobStorageService
{
    // Uploads a policy document and returns its blob path (to store in PolicyDocument.BlobPath).
    Task<string> UploadPolicyDocumentAsync(
        string clientId, string policyId, string documentType, string fileName,
        Stream content, string? contentType, CancellationToken ct = default);

    // Uploads a claim document and returns its blob path.
    Task<string> UploadClaimDocumentAsync(
        string clientId, string policyId, string documentType, string fileName,
        Stream content, string? contentType, CancellationToken ct = default);

    Task<(Stream Content, string? ContentType)?> DownloadAsync(string blobPath, CancellationToken ct = default);

    Task DeleteAsync(string blobPath, CancellationToken ct = default);
}
