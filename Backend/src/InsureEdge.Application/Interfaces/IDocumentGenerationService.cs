// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Document Generation PRD §5: IE_Policy_BL orchestration —
// GenerationDocuments_QuoteProposalPackage + GetandDownloadDocument, surfaced to the
// Documents screen's "Generated Documents" tab.
namespace InsureEdge.Application.Interfaces;

public record GeneratedDocumentDto(
    long Id,
    string? FileName,
    string? FileType,
    string? TransactionType,
    string? Version,
    DateTime CreatedOn);

public record GenerateDocumentResult(bool Success, string Message, long? DocumentId, byte[]? Pdf, string FileName);

// Client Documents tab: user-uploaded attachments on the submission (not system-generated).
public record ClientDocumentDto(long Id, string DocumentName, DateTime UploadedOn);

// The 65 "Our Policy Nonrenewal" checkbox selections + the 1 "Your Nonrenewal" selection —
// these are never persisted (confirmed against the source OutSystems action: they exist only
// transiently to render the notice document), so they're passed straight through here.
public record NoticeOfNonRenewalSelections(bool CheckBoxYourNonRenewal, IReadOnlyList<bool> Attributes);

public interface IDocumentGenerationService
{
    // PRD §4.4/§5.1/§5.5 — the full DownloadQuoteOnClick server-side flow: start both
    // Plumsail jobs, poll to completion, download, merge, persist PolicyDocument, and
    // return the merged binary ("Quote Proposal Package.pdf").
    Task<GenerateDocumentResult> GenerateQuoteProposalPackageAsync(string submissionId);

    // Do Not Renew: generates the "Notice of Policy Nonrenewal" PDF from the transient
    // checkbox selections + policy/account data, and persists it as a PolicyDocument
    // (TransactionType="Do Not Renew", versioned). Returns Success=false (non-fatal —
    // caller should still complete the status flip) when the Plumsail template mapping
    // isn't configured for this client, same convention as the Quote Proposal package.
    Task<GenerateDocumentResult> GenerateNoticeOfNonRenewalAsync(long policyId, NoticeOfNonRenewalSelections selections);

    // Generated-documents grid rows (PolicyDocument entries for the policy).
    Task<IReadOnlyList<GeneratedDocumentDto>> ListGeneratedAsync(string submissionId);

    // Per-row Download/Preview: stream a previously generated document's stored binary.
    Task<(byte[] Bytes, string FileName, string ContentType)?> GetGeneratedBinaryAsync(string submissionId, long documentId);

    // Client Documents tab: user-uploaded attachment, persisted to blob storage as a
    // PolicyDocument (TransactionType="ClientUpload").
    Task<ClientDocumentDto> UploadClientDocumentAsync(string submissionId, string fileName, string? documentType, Stream content, string? contentType);

    // Client Documents grid rows for the submission's policy.
    Task<IReadOnlyList<ClientDocumentDto>> ListClientDocumentsAsync(string submissionId);

    // Per-row Download/Preview: stream a document's stored binary by id alone (tenant-scoped),
    // for the standalone /api/documents/{id}/view|download routes.
    Task<(byte[] Bytes, string FileName, string ContentType)?> GetDocumentBinaryByIdAsync(long documentId);
}
