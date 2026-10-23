// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Policy Summary "Notes" tab DTOs.
namespace InsureEdge.Application.DTOs.QuotesPolicies;

public record NoteFileDto(
    long Id,
    string FileName,
    string? FileType
);

public record NoteDto(
    long Id,
    string NotesText,
    string AccessType,
    string Module,
    string? CreatedByName,
    string CreatedOn,     // MM-dd-yyyy , HH:mm:ss
    List<NoteFileDto> Files
);

public record NoteFileUploadDto(string FileName, string? FileType, byte[] Data);

public record CreateNoteRequestDto(
    string AccessType,
    string NotesText,
    List<NoteFileUploadDto>? Files
);

public record UpdateNoteRequestDto(
    string AccessType,
    string NotesText,
    List<NoteFileUploadDto>? NewFiles,
    List<long>? RemoveFileIds
);
