// Azure Blob Storage implementation of IBlobStorageService. Path/metadata convention confirmed
// against the "Domain Conceptual Diagrams" doc (2026-09-25) — see IBlobStorageService for the
// full layout. Exceptions are deliberately not logged with their message/ToString(): Azure SDK
// exceptions can echo the SAS/connection string back in the error text, and this connects to a
// credentialed external resource.
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using InsureEdge.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace InsureEdge.Infrastructure.Documents;

public class AzureBlobStorageService : IBlobStorageService
{
    private readonly BlobContainerClient? _container;
    private readonly string _rootFolder;
    private readonly ILogger<AzureBlobStorageService> _log;

    public AzureBlobStorageService(IConfiguration config, ILogger<AzureBlobStorageService> log)
    {
        _log = log;
        _rootFolder = config["AzureBlobStorage:RootFolder"] ?? "dev";

        var connectionString = config["AzureBlobStorage:ConnectionString"];
        var containerName = config["AzureBlobStorage:Container"];
        if (!string.IsNullOrWhiteSpace(connectionString) && !string.IsNullOrWhiteSpace(containerName))
        {
            _container = new BlobContainerClient(connectionString, containerName);
        }
    }

    public Task<string> UploadPolicyDocumentAsync(
        string clientId, string policyId, string documentType, string fileName,
        Stream content, string? contentType, CancellationToken ct = default)
    {
        var path = $"{_rootFolder}/{clientId}/{policyId}/{BuildBlobName(policyId, documentType, fileName)}";
        return UploadAsync(path, fileName, documentType, content, contentType, ct);
    }

    public Task<string> UploadClaimDocumentAsync(
        string clientId, string policyId, string documentType, string fileName,
        Stream content, string? contentType, CancellationToken ct = default)
    {
        var path = $"{_rootFolder}/{clientId}/Claims/{BuildBlobName(policyId, documentType, fileName)}";
        return UploadAsync(path, fileName, documentType, content, contentType, ct);
    }

    private static string BuildBlobName(string policyId, string documentType, string fileName)
    {
        var ext = Path.GetExtension(fileName).TrimStart('.');
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        return $"{policyId}_{documentType}-{timestamp}.{ext}";
    }

    private async Task<string> UploadAsync(
        string blobPath, string fileName, string documentType,
        Stream content, string? contentType, CancellationToken ct)
    {
        if (_container == null)
            throw new InvalidOperationException("Azure Blob Storage is not configured.");

        try
        {
            var blob = _container.GetBlobClient(blobPath);
            var headers = new BlobHttpHeaders { ContentType = contentType ?? "application/octet-stream" };
            await blob.UploadAsync(content, new BlobUploadOptions
            {
                HttpHeaders = headers,
                Metadata = new Dictionary<string, string>
                {
                    ["DocumentType"] = documentType,
                    ["DocumentName"] = fileName,
                    ["UploadedDate"] = DateTime.UtcNow.ToString("O"),
                },
            }, ct);
            return blobPath;
        }
        catch (Exception)
        {
            _log.LogWarning("Blob upload failed for {BlobPath} (see Azure portal / storage logs for details).", blobPath);
            throw;
        }
    }

    public async Task<(Stream Content, string? ContentType)?> DownloadAsync(string blobPath, CancellationToken ct = default)
    {
        if (_container == null) return null;
        try
        {
            var blob = _container.GetBlobClient(blobPath);
            var result = await blob.DownloadContentAsync(ct);
            return (result.Value.Content.ToStream(), result.Value.Details.ContentType);
        }
        catch (Exception)
        {
            _log.LogWarning("Blob download failed for {BlobPath} (see Azure portal / storage logs for details).", blobPath);
            return null;
        }
    }

    public async Task DeleteAsync(string blobPath, CancellationToken ct = default)
    {
        if (_container == null) return;
        try
        {
            await _container.GetBlobClient(blobPath).DeleteIfExistsAsync(cancellationToken: ct);
        }
        catch (Exception)
        {
            _log.LogWarning("Blob delete failed for {BlobPath} (see Azure portal / storage logs for details).", blobPath);
        }
    }
}
