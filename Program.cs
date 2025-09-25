using System.Text.Json;
using Microsoft.AspNetCore.StaticFiles;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using InternApp.Data;
using InternApp.Models;
using InternApp.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options => options.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

// Add Entity Framework with SQLite
var connectionString = "Data Source=app.db";
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(connectionString));

// Add authentication service
builder.Services.AddScoped<AuthService>();

var app = builder.Build();
app.UseCors();

var webRoot = Path.Combine(AppContext.BaseDirectory, "wwwroot");
if (!Directory.Exists(webRoot)) Directory.CreateDirectory(webRoot);
var uploadDir = Path.Combine(AppContext.BaseDirectory, "uploads");
if (!Directory.Exists(uploadDir)) Directory.CreateDirectory(uploadDir);

// Ensure database is created and migrate existing data
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    context.Database.EnsureCreated();
    
    // Migrate existing JSON data if it exists
    var jsonDataFile = Path.Combine(AppContext.BaseDirectory, "data.json");
    if (File.Exists(jsonDataFile))
    {
        await MigrationHelper.MigrateFromJsonAsync(context, jsonDataFile);
    }
}

// Helper function to get user ID from request
string GetUserId(HttpRequest req)
{
    // Try to get from Authorization header (Bearer token)
    var authHeader = req.Headers["Authorization"].FirstOrDefault();
    if (authHeader != null && authHeader.StartsWith("Bearer "))
    {
        var token = authHeader.Substring("Bearer ".Length);
        using var scope = app.Services.CreateScope();
        var authService = scope.ServiceProvider.GetRequiredService<AuthService>();
        var userId = authService.GetUserIdFromToken(token);
        if (userId.HasValue)
        {
            return userId.Value.ToString();
        }
    }
    
    // Try to get from X-User-ID header (legacy support)
    if (req.Headers.TryGetValue("X-User-ID", out var headerUserId))
        return headerUserId.ToString();
    
    // Fallback to query parameter
    if (req.Query.TryGetValue("userId", out var queryUserId))
        return queryUserId.ToString();
    
    // Generate a default user ID if none provided
    return "default_user";
}

app.UseDefaultFiles();
app.UseStaticFiles();

// Authentication Endpoints
app.MapPost("/api/auth/login", async (LoginRequest request, ApplicationDbContext context, AuthService authService) =>
{
    var user = await authService.AuthenticateAsync(request.Email, request.Password);
    if (user == null)
    {
        return Results.Json(new { message = "Invalid email or password" }, statusCode: 401);
    }

    var token = authService.GenerateToken(user);
    return Results.Json(new { 
        token, 
        user = new { id = user.Id, name = user.Name, email = user.Email } 
    });
});

app.MapPost("/api/auth/signup", async (SignupRequest request, ApplicationDbContext context, AuthService authService) =>
{
    var user = await authService.RegisterAsync(request.Name, request.Email, request.Password);
    if (user == null)
    {
        return Results.Json(new { message = "Email already exists" }, statusCode: 400);
    }

    var token = authService.GenerateToken(user);
    return Results.Json(new { 
        token, 
        user = new { id = user.Id, name = user.Name, email = user.Email } 
    });
});

app.MapGet("/api/auth/me", async (HttpRequest req, ApplicationDbContext context, AuthService authService) =>
{
    var authHeader = req.Headers["Authorization"].FirstOrDefault();
    if (authHeader == null || !authHeader.StartsWith("Bearer "))
    {
        return Results.Json(new { message = "No token provided" }, statusCode: 401);
    }

    var token = authHeader.Substring("Bearer ".Length);
    var userId = authService.GetUserIdFromToken(token);
    if (userId == null)
    {
        return Results.Json(new { message = "Invalid token" }, statusCode: 401);
    }

    var user = await authService.GetUserByIdAsync(userId.Value);
    if (user == null)
    {
        return Results.Json(new { message = "User not found" }, statusCode: 404);
    }

    return Results.Json(new { id = user.Id, name = user.Name, email = user.Email });
});

app.MapPost("/api/resumes", async (HttpRequest req) => {
    if (!req.HasFormContentType) return Results.BadRequest(new { error = "form required" });
    var userId = GetUserId(req);
    var form = await req.ReadFormAsync();
    var file = form.Files.GetFile("resume");
    var name = form["name"].ToString();
    if (file == null) return Results.BadRequest(new { error = "file missing" });
    
    var filename = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + "-" + Path.GetFileName(file.FileName);
    var dest = Path.Combine(uploadDir, filename);
    using var fs = File.Create(dest);
    await file.CopyToAsync(fs);
    
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    
    var resume = new Resume
    {
        UserId = userId,
        FileName = filename,
        OriginalName = file.FileName,
        DisplayName = string.IsNullOrWhiteSpace(name) ? null : name,
        CreatedAt = DateTime.UtcNow
    };
    
    context.Resumes.Add(resume);
    await context.SaveChangesAsync();
    
    return Results.Ok(new { resume.Id, resume.FileName, resume.OriginalName, DisplayName = resume.DisplayName, resume.CreatedAt });
});

app.MapGet("/api/resumes", async (HttpRequest req) => {
    var userId = GetUserId(req);
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    
    var resumes = await context.Resumes
        .Where(r => r.UserId == userId)
        .OrderByDescending(r => r.CreatedAt)
        .Select(r => new { r.Id, r.FileName, r.OriginalName, DisplayName = r.DisplayName, Url = "/uploads/" + r.FileName, r.CreatedAt })
        .ToListAsync();
    
    return Results.Ok(resumes);
});

// Get resume content
app.MapGet("/api/resumes/{id:int}/content", async (int id, HttpRequest req) => {
    var userId = GetUserId(req);
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    
    var resume = await context.Resumes
        .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
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
app.MapDelete("/api/resumes/{id:int}", async (int id, HttpRequest req) => {
    var userId = GetUserId(req);
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    
    var resume = await context.Resumes
        .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
    if (resume == null) return Results.NotFound();
    
    context.Resumes.Remove(resume);
    await context.SaveChangesAsync();
    
    var path = Path.Combine(uploadDir, resume.FileName);
    try{
        if (File.Exists(path)) File.Delete(path);
    }catch{}
    return Results.Ok(new { success = true });
});

app.MapPost("/api/postings", async (Posting p, HttpRequest req) =>
{
    var userId = GetUserId(req);
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    
    var posting = new Posting
    {
        UserId = userId,
        Title = p.Title,
        Company = p.Company,
        Description = p.Description,
        DueDate = p.DueDate,
        Status = p.Status,
        CreatedAt = DateTime.UtcNow
    };
    
    context.Postings.Add(posting);
    await context.SaveChangesAsync();
    
    return Results.Ok(new { posting.Id, posting.Title, posting.Company, posting.Description, posting.DueDate, posting.Status, posting.CreatedAt });
});

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

app.MapGet("/api/postings", async (HttpRequest req) => {
    var userId = GetUserId(req);
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    
    var postings = await context.Postings
        .Where(p => p.UserId == userId)
        .OrderByDescending(p => p.CreatedAt)
        .ToListAsync();
    
    return Results.Ok(postings);
});

// Update a posting
app.MapPut("/api/postings/{id:int}", async (int id, Posting p, HttpRequest req) => {
    var userId = GetUserId(req);
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    
    var posting = await context.Postings
        .FirstOrDefaultAsync(po => po.Id == id && po.UserId == userId);
    if (posting == null) return Results.NotFound();
    
    posting.Title = p.Title;
    posting.Company = p.Company;
    posting.Description = p.Description;
    posting.DueDate = p.DueDate;
    posting.Status = p.Status;
    
    await context.SaveChangesAsync();
    return Results.Ok(new { posting.Id, posting.Title, posting.Company, posting.Description, posting.DueDate, posting.Status, posting.CreatedAt });
});

// Delete a posting
app.MapDelete("/api/postings/{id:int}", async (int id, HttpRequest req) => {
    var userId = GetUserId(req);
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    
    var posting = await context.Postings
        .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);
    if (posting == null) return Results.NotFound();
    
    context.Postings.Remove(posting);
    await context.SaveChangesAsync();
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

record TailorRequest(string PostingUrl, int ResumeId);
record OllamaRequest([property: JsonPropertyName("prompt")] string Prompt);
record LoginRequest(string Email, string Password);
record SignupRequest(string Name, string Email, string Password);

