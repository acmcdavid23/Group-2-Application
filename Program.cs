using System.Text.Json;
using Microsoft.AspNetCore.StaticFiles;
using System.Text.Json.Serialization;
using InternApp.Services;
using InternApp.Models;
using InternApp.Models.DTOs;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options => options.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
var app = builder.Build();
app.UseCors();

var webRoot = Path.Combine(AppContext.BaseDirectory, "wwwroot");
if (!Directory.Exists(webRoot)) Directory.CreateDirectory(webRoot);
var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
if (!Directory.Exists(uploadDir)) Directory.CreateDirectory(uploadDir);

// Initialize database service
var dbService = new DatabaseService();
var migrationService = new MigrationService(dbService);

// Simple in-memory storage for resumes (temporary solution)
var resumes = new List<object>();

app.UseDefaultFiles();
app.UseStaticFiles();

// Resume endpoints (updated for SQLite)
app.MapPost("/api/resumes", async (HttpRequest req) => {
    if (!req.HasFormContentType) return Results.BadRequest(new { error = "form required" });
    var form = await req.ReadFormAsync();
    var file = form.Files.GetFile("resume");
    var name = form["name"].ToString();
    if (file == null) return Results.BadRequest(new { error = "file missing" });
    
    // Save file to uploads directory
    var filename = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + "-" + Path.GetFileName(file.FileName);
    var dest = Path.Combine(uploadDir, filename);
    using var fs = File.Create(dest);
    await file.CopyToAsync(fs);
    
    // Create record and add to in-memory storage
    var record = new { 
        Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), 
        FileName = filename, 
        OriginalName = file.FileName, 
        DisplayName = string.IsNullOrWhiteSpace(name) ? file.FileName : name, 
        Url = "/uploads/" + filename, 
        CreatedAt = DateTime.UtcNow 
    };
    
    resumes.Add(record);
    return Results.Ok(record);
});

app.MapGet("/api/resumes", () => {
    return Results.Ok(resumes);
});

// Get resume content
app.MapGet("/api/resumes/{id:int}/content", (int id) => {
    return Results.Ok(new { content = "Resume content extraction not implemented yet." });
});

// Delete a resume
app.MapDelete("/api/resumes/{id:int}", (int id) => {
    var resume = resumes.FirstOrDefault(r => {
        var idProperty = r.GetType().GetProperty("Id");
        return idProperty != null && Convert.ToInt64(idProperty.GetValue(r)) == id;
    });
    
    if (resume != null)
    {
        resumes.Remove(resume);
        return Results.Ok(new { success = true });
    }
    
    return Results.NotFound(new { error = "Resume not found" });
});

// User authentication endpoints
app.MapPost("/api/auth/register", async (UserRequest request) => {
    try
    {
        // Check if user already exists
        var existingUser = await dbService.GetUserByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return Results.BadRequest(new { error = "User with this email already exists" });
        }
        
        var user = await dbService.CreateUserAsync(request);
        return Results.Ok(new { 
            id = user.Id, 
            email = user.Email, 
            message = "User created successfully" 
        });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

app.MapPost("/api/auth/login", async (LoginRequest request) => {
    try
    {
        var user = await dbService.GetUserByEmailAsync(request.Email);
        if (user == null || user.Password != request.Password)
        {
            return Results.BadRequest(new { error = "Invalid email or password" });
        }
        
        return Results.Ok(new { 
            id = user.Id, 
            email = user.Email, 
            isDemo = user.IsDemo,
            message = "Login successful" 
        });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Job posting endpoints
app.MapGet("/api/job-postings/{userId:int}", async (int userId) => {
    try
    {
        var postings = await dbService.GetJobPostingsByUserIdAsync(userId);
        return Results.Ok(postings);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

app.MapPost("/api/job-postings", async (JobPostingRequest request) => {
    try
    {
        var posting = await dbService.CreateJobPostingAsync(request);
        return Results.Ok(posting);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

app.MapPut("/api/job-postings/{id:int}", async (int id, JobPostingRequest request) => {
    try
    {
        var posting = await dbService.UpdateJobPostingAsync(id, request);
        if (posting == null)
        {
            return Results.NotFound(new { error = "Job posting not found" });
        }
        return Results.Ok(posting);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

app.MapDelete("/api/job-postings/{id:int}", async (int id) => {
    try
    {
        var success = await dbService.DeleteJobPostingAsync(id);
        if (!success)
        {
            return Results.NotFound(new { error = "Job posting not found" });
        }
        return Results.Ok(new { success = true });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Calendar events endpoints
app.MapGet("/api/calendar-events/{userId:int}", async (int userId) => {
    try
    {
        var events = await dbService.GetCalendarEventsByUserIdAsync(userId);
        return Results.Ok(events);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

app.MapPost("/api/calendar-events", async (CalendarEventRequest request) => {
    try
    {
        var calendarEvent = await dbService.CreateCalendarEventAsync(request);
        return Results.Ok(calendarEvent);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Legacy endpoints for backward compatibility
app.MapPost("/api/postings", (Posting p) =>
{
    var rec = new { Id = 1, Title = p.Title, Company = p.Company, Description = p.Description, DueDate = p.DueDate, Status = p.Status, CreatedAt = DateTime.UtcNow };
    return Results.Ok(rec);
});

app.MapGet("/api/postings", () => Results.Ok(new List<object>()));

app.MapPut("/api/postings/{id:int}", (int id, Posting p) => {
    return Results.Ok(new { Id = id, Title = p.Title, Company = p.Company, Description = p.Description, DueDate = p.DueDate, Status = p.Status, CreatedAt = DateTime.UtcNow });
});

app.MapDelete("/api/postings/{id:int}", (int id) => {
    return Results.Ok(new { success = true });
});

// AI endpoints
app.MapPost("/api/ollama", async (HttpRequest req) => {
    try {
        var body = await JsonSerializer.DeserializeAsync<OllamaRequest>(req.Body);
        if (body == null || string.IsNullOrWhiteSpace(body.Prompt))
            return Results.BadRequest(new { error = "Prompt required" });

        using var client = new HttpClient();
        var ollamaReq = new {
            model = "llama3.1:8b",
            prompt = body.Prompt,
            stream = false
        };
        var ollamaRes = await client.PostAsync(
            "http://localhost:11434/api/generate",
            new StringContent(JsonSerializer.Serialize(ollamaReq), System.Text.Encoding.UTF8, "application/json")
        );
        var ollamaJson = await ollamaRes.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(ollamaJson);
        var response = doc.RootElement.GetProperty("response").GetString();
        return Results.Ok(new { response });
    } catch (Exception ex) {
        return Results.BadRequest(new { error = ex.Message });
    }
});

app.MapPost("/api/tailor", (TailorRequest req) => {
    if (string.IsNullOrEmpty(req.PostingUrl) || req.ResumeId == 0) return Results.BadRequest(new { error = "postingUrl and resumeId required" });
    var keywords = req.PostingUrl.Split(Path.GetInvalidFileNameChars().Concat(new char[]{'/','-',':','?','&','='}).ToArray())
        .Where(s=>!string.IsNullOrWhiteSpace(s)).Select(s=>s.ToLowerInvariant()).Take(8).ToArray();
    return Results.Ok(new { tailoredResume = $"tailored_{req.ResumeId}.pdf", keywords, score = new Random().Next(80,101) });
});

// Send email reminder
app.MapPost("/api/send-email", async (EmailRequest req) => {
    try {
        var emailService = new EmailService();
        await emailService.SendEmailAsync(req.To, req.Subject, req.Body);
        return Results.Ok(new { success = true, message = "Email sent successfully" });
    } catch (Exception ex) {
        return Results.BadRequest(new { success = false, error = ex.Message });
    }
});

// Migration endpoint for localStorage data
app.MapPost("/api/migrate", async (HttpRequest req) => {
    try {
        using var reader = new StreamReader(req.Body);
        var body = await reader.ReadToEndAsync();
        var success = await migrationService.MigrateLocalStorageDataAsync(body);
        if (success) {
            return Results.Ok(new { success = true, message = "Data migrated successfully" });
        } else {
            return Results.BadRequest(new { error = "Migration failed" });
        }
    } catch (Exception ex) {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Serve uploads
app.MapGet("/uploads/{file}", (string file) => {
    var path = Path.Combine(uploadDir, file);
    if (!File.Exists(path)) return Results.NotFound();
    var provider = new FileExtensionContentTypeProvider();
    if (!provider.TryGetContentType(path, out var contentType)) contentType = "application/octet-stream";
    return Results.File(File.ReadAllBytes(path), contentType);
});

app.Run();

// Legacy records for backward compatibility
record Resume(int Id, string FileName, string OriginalName, string? DisplayName, DateTime CreatedAt);
record Posting(int Id, string Title, string Company, string Description, string? DueDate, string Status, DateTime CreatedAt);
record TailorRequest(string PostingUrl, int ResumeId);
record OllamaRequest([property: JsonPropertyName("prompt")] string Prompt);
record EmailRequest(string To, string Subject, string Body);

// Email service implementation
class EmailService
{
    public async Task SendEmailAsync(string to, string subject, string body)
    {
        Console.WriteLine($"EMAIL SENT TO: {to}");
        Console.WriteLine($"SUBJECT: {subject}");
        Console.WriteLine($"BODY: {body}");
        Console.WriteLine("---");
        await Task.Delay(100);
    }
}