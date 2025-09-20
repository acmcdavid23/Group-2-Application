using System.Text.Json;
using Microsoft.AspNetCore.StaticFiles;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options => options.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
var app = builder.Build();
app.UseCors();

var webRoot = Path.Combine(AppContext.BaseDirectory, "wwwroot");
if (!Directory.Exists(webRoot)) Directory.CreateDirectory(webRoot);
var uploadDir = Path.Combine(AppContext.BaseDirectory, "uploads");
if (!Directory.Exists(uploadDir)) Directory.CreateDirectory(uploadDir);

var dataFile = Path.Combine(AppContext.BaseDirectory, "data.json");
var store = new DataStore(dataFile);

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapPost("/api/resumes", async (HttpRequest req) => {
    if (!req.HasFormContentType) return Results.BadRequest(new { error = "form required" });
    var form = await req.ReadFormAsync();
    var file = form.Files.GetFile("resume");
    var name = form["name"].ToString();
    if (file == null) return Results.BadRequest(new { error = "file missing" });
    var filename = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + "-" + Path.GetFileName(file.FileName);
    var dest = Path.Combine(uploadDir, filename);
    using var fs = File.Create(dest);
    await file.CopyToAsync(fs);
    var record = store.AddResume(filename, file.FileName, string.IsNullOrWhiteSpace(name) ? null : name);
    return Results.Ok(record);
});

app.MapGet("/api/resumes", () => Results.Ok(store.GetResumes().Select(r => new { r.Id, r.FileName, r.OriginalName, DisplayName = r.DisplayName, Url = "/uploads/" + r.FileName, r.CreatedAt })));

// Get resume content
app.MapGet("/api/resumes/{id:int}/content", (int id) => {
    var resume = store.GetResumes().FirstOrDefault(r => r.Id == id);
    if (resume == null) return Results.NotFound();
    
    var filePath = Path.Combine(uploadDir, resume.FileName);
    if (!File.Exists(filePath)) return Results.NotFound();
    
    try {
        // Try to extract text from PDF
        var text = ExtractTextFromPdf(filePath);
        return Results.Ok(new { content = text });
    } catch {
        return Results.Ok(new { content = "Unable to extract text from this file type" });
    }
});

// Delete a resume (remove metadata and delete uploaded file)
app.MapDelete("/api/resumes/{id:int}", (int id) => {
    var removed = store.RemoveResume(id);
    if (removed == null) return Results.NotFound();
    var path = Path.Combine(uploadDir, removed.FileName);
    try{
        if (File.Exists(path)) File.Delete(path);
    }catch{}
    return Results.Ok(new { success = true });
});

app.MapPost("/api/postings", (Posting p) => {
    var rec = store.AddPosting(p.Title, p.Company, p.Description, p.DueDate);
    return Results.Ok(rec);
});

app.MapGet("/api/postings", () => Results.Ok(store.GetPostings()));

// Update a posting
app.MapPut("/api/postings/{id:int}", (int id, Posting p) => {
    var updated = store.UpdatePosting(id, p.Title, p.Company, p.Description, p.DueDate);
    if (updated == null) return Results.NotFound();
    return Results.Ok(updated);
});

// Delete a posting
app.MapDelete("/api/postings/{id:int}", (int id) => {
    var removed = store.RemovePosting(id);
    if (removed == null) return Results.NotFound();
    return Results.Ok(new { success = true });
});

app.MapPost("/api/tailor", (TailorRequest req) => {
    if (string.IsNullOrEmpty(req.PostingUrl) || req.ResumeId == 0) return Results.BadRequest(new { error = "postingUrl and resumeId required" });
    var keywords = req.PostingUrl.Split(Path.GetInvalidFileNameChars().Concat(new char[]{'/','-',':','?','&','='}).ToArray())
        .Where(s=>!string.IsNullOrWhiteSpace(s)).Select(s=>s.ToLowerInvariant()).Take(8).ToArray();
    return Results.Ok(new { tailoredResume = $"tailored_{req.ResumeId}.pdf", keywords, score = new Random().Next(80,101) });
});

// Serve uploads
app.MapGet("/uploads/{file}", (string file) => {
    var path = Path.Combine(uploadDir, file);
    if (!File.Exists(path)) return Results.NotFound();
    var provider = new FileExtensionContentTypeProvider();
    if (!provider.TryGetContentType(path, out var contentType)) contentType = "application/octet-stream";
    return Results.File(File.ReadAllBytes(path), contentType);
});

// Simple PDF text extraction (basic implementation)
string ExtractTextFromPdf(string filePath) {
    try {
        // For now, return a placeholder - in a real implementation you'd use a PDF library
        // like iTextSharp or PdfPig to extract text from PDFs
        return "PDF content extraction not implemented yet. Please copy and paste your resume content manually.";
    } catch {
        return "Unable to extract text from this file.";
    }
}

app.Run();

record Resume(int Id, string FileName, string OriginalName, string? DisplayName, DateTime CreatedAt);
record Posting(int Id, string Title, string Company, string Description, string? DueDate, string Status, DateTime CreatedAt);
record TailorRequest(string PostingUrl, int ResumeId);

class DataStore
{
    readonly string _path;
    AppData _data;
    public DataStore(string path){ _path = path; if (File.Exists(path)) _data = JsonSerializer.Deserialize<AppData>(File.ReadAllText(path)) ?? new AppData(); else _data = new AppData(); }
    void Flush(){ File.WriteAllText(_path, JsonSerializer.Serialize(_data)); }
    public Resume AddResume(string filename, string original, string? displayName){ var id = ++_data.LastId; var r = new Resume(id, filename, original, displayName, DateTime.UtcNow); _data.Resumes.Add(r); Flush(); return r; }
    public IEnumerable<Resume> GetResumes() => _data.Resumes.OrderByDescending(r=>r.CreatedAt);
    public Resume? RemoveResume(int id){ var r = _data.Resumes.FirstOrDefault(x=>x.Id==id); if(r==null) return null; _data.Resumes.Remove(r); Flush(); return r; }
    public Posting AddPosting(string title, string company, string description, string? due){ var id = ++_data.LastId; var p = new Posting(id, title, company, description, due, "not-applied", DateTime.UtcNow); _data.Postings.Add(p); Flush(); return p; }
    public IEnumerable<Posting> GetPostings() => _data.Postings.OrderByDescending(p=>p.CreatedAt);
    public Posting? UpdatePosting(int id, string title, string company, string description, string? due){ var p = _data.Postings.FirstOrDefault(x=>x.Id==id); if(p==null) return null; var updated = p with { Title = title, Company = company, Description = description, DueDate = due }; var index = _data.Postings.IndexOf(p); _data.Postings[index] = updated; Flush(); return updated; }
    public Posting? RemovePosting(int id){ var p = _data.Postings.FirstOrDefault(x=>x.Id==id); if(p==null) return null; _data.Postings.Remove(p); Flush(); return p; }
}

class AppData{ public int LastId {get; set;} = 0; public List<Resume> Resumes {get; set;} = new(); public List<Posting> Postings {get; set;} = new(); }

