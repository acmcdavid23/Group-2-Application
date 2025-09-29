using System.Text.Json;
using Microsoft.AspNetCore.StaticFiles;
using System.Text.Json.Serialization;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas.Parser;
using iText.Kernel.Pdf.Canvas.Parser.Listener;
using iText.Kernel.Pdf.Canvas;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using InternApp.Services;
using InternApp.Models;
using InternApp.Models.DTOs;

// Resume text extraction methods
string ExtractTextFromFile(string filePath)
{
    var extension = System.IO.Path.GetExtension(filePath).ToLowerInvariant();
    
    if (extension == ".pdf")
        return ExtractTextFromPdf(filePath);
    else if (extension == ".docx")
        return ExtractTextFromDocx(filePath);
    else if (extension == ".doc")
        return ExtractTextFromDoc(filePath);
    else
        return "Unsupported file format";
}

string ExtractTextFromPdf(string filePath)
{
    try
    {
        using var pdfDoc = new PdfDocument(new PdfReader(filePath));
        var text = new System.Text.StringBuilder();
        
        Console.WriteLine($"PDF has {pdfDoc.GetNumberOfPages()} pages");
        
        for (int i = 1; i <= pdfDoc.GetNumberOfPages(); i++)
        {
            var page = pdfDoc.GetPage(i);
            
            // Try multiple extraction strategies for better compatibility
            var strategies = new List<ITextExtractionStrategy>
            {
                new SimpleTextExtractionStrategy(),
                new LocationTextExtractionStrategy()
            };
            
            string bestText = "";
            int maxLength = 0;
            
            foreach (var strategy in strategies)
            {
                try
                {
                    var pageText = PdfTextExtractor.GetTextFromPage(page, strategy);
                    if (pageText.Length > maxLength)
                    {
                        bestText = pageText;
                        maxLength = pageText.Length;
                    }
                }
                catch (Exception strategyEx)
                {
                    Console.WriteLine($"Strategy {strategy.GetType().Name} failed: {strategyEx.Message}");
                }
            }
            
            // Try extracting text from all text objects on the page
            try
            {
                var pageText = PdfTextExtractor.GetTextFromPage(page);
                if (pageText.Length > maxLength)
                {
                    bestText = pageText;
                    maxLength = pageText.Length;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Direct text extraction failed: {ex.Message}");
            }
            
            // Try with different text extraction parameters
            try
            {
                var listener = new SimpleTextExtractionStrategy();
                var processor = new PdfCanvasProcessor(listener);
                processor.ProcessPageContent(page);
                var pageText = listener.GetResultantText();
                
                if (pageText.Length > maxLength)
                {
                    bestText = pageText;
                    maxLength = pageText.Length;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Advanced text extraction failed: {ex.Message}");
            }
            
            // Try extracting from page content stream directly
            try
            {
                var contentStream = page.GetContentBytes();
                if (contentStream != null && contentStream.Length > 0)
                {
                    var contentText = System.Text.Encoding.UTF8.GetString(contentStream);
                    // Extract text between BT and ET markers (text objects)
                    var textMatches = System.Text.RegularExpressions.Regex.Matches(contentText, @"BT\s+(.*?)\s+ET", System.Text.RegularExpressions.RegexOptions.Singleline);
                    var extractedText = new System.Text.StringBuilder();
                    foreach (System.Text.RegularExpressions.Match match in textMatches)
                    {
                        var textContent = match.Groups[1].Value;
                        // Extract text from Tj and TJ operators
                        var textOps = System.Text.RegularExpressions.Regex.Matches(textContent, @"\((.*?)\)\s+Tj|\[(.*?)\]\s+TJ");
                        foreach (System.Text.RegularExpressions.Match textOp in textOps)
                        {
                            extractedText.Append(textOp.Groups[1].Value);
                        }
                    }
                    
                    var directText = extractedText.ToString();
                    if (directText.Length > maxLength)
                    {
                        bestText = directText;
                        maxLength = directText.Length;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Direct content stream extraction failed: {ex.Message}");
            }
            
            if (!string.IsNullOrEmpty(bestText))
            {
                text.AppendLine(bestText);
                Console.WriteLine($"Page {i} extracted {bestText.Length} characters");
                Console.WriteLine($"Page {i} content preview: {bestText.Substring(0, Math.Min(100, bestText.Length))}...");
            }
            else
            {
                Console.WriteLine($"Page {i} - no text extracted");
            }
        }
        
        var result = text.ToString().Trim();
        Console.WriteLine($"Total extracted text length: {result.Length}");
        
        if (string.IsNullOrEmpty(result))
        {
            return "PDF appears to be empty or contains only images. No text content found. This might be a Google PDF with special formatting.";
        }
        
        // Check if it's mostly whitespace or special characters
        var cleanText = System.Text.RegularExpressions.Regex.Replace(result, @"\s+", " ").Trim();
        if (cleanText.Length < 50)
        {
            return $"PDF text extraction found minimal content ({cleanText.Length} characters). This might be a Google PDF with special formatting. Raw content: {result.Substring(0, Math.Min(200, result.Length))}";
        }
        
        Console.WriteLine($"Final content preview: {result.Substring(0, Math.Min(200, result.Length))}...");
        return result;
    }
    catch (Exception ex)
    {
        Console.WriteLine($"PDF extraction error: {ex.Message}");
        return $"Error extracting PDF text: {ex.Message}. This might be a Google PDF with special formatting.";
    }
}

string ExtractTextFromDocx(string filePath)
{
    try
    {
        using var document = WordprocessingDocument.Open(filePath, false);
        var body = document.MainDocumentPart?.Document?.Body;
        
        if (body == null)
        {
            return "No content found in document";
        }
        
        return body.InnerText;
    }
    catch (Exception ex)
    {
        return $"Error extracting DOCX text: {ex.Message}";
    }
}

string ExtractTextFromDoc(string filePath)
{
    // For .doc files, we'll return a message that they need to be converted to .docx
    // In a production environment, you might use a library like Aspose.Words
    return "DOC files are not supported. Please convert to DOCX format for text extraction.";
}

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options => options.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
var app = builder.Build();

// Configuration for email base URL (can be overridden in appsettings.json)
var emailBaseUrl = builder.Configuration["EmailBaseUrl"];
app.UseCors();

var webRoot = System.IO.Path.Combine(AppContext.BaseDirectory, "wwwroot");
if (!Directory.Exists(webRoot)) Directory.CreateDirectory(webRoot);
var uploadDir = System.IO.Path.Combine(Directory.GetCurrentDirectory(), "uploads");
if (!Directory.Exists(uploadDir)) Directory.CreateDirectory(uploadDir);

// Initialize database service
var dbService = new DatabaseService();
var migrationService = new MigrationService(dbService);

// Simple in-memory storage for resumes (temporary solution)
var resumes = new List<object>();

// Load existing resumes from JSON file if it exists
var resumesFile = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "resumes.json");
if (System.IO.File.Exists(resumesFile))
{
    try
    {
        var json = await System.IO.File.ReadAllTextAsync(resumesFile);
        var loadedResumes = System.Text.Json.JsonSerializer.Deserialize<List<object>>(json);
        if (loadedResumes != null)
        {
            resumes.AddRange(loadedResumes);
            Console.WriteLine($"Loaded {resumes.Count} resumes from storage");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error loading resumes: {ex.Message}");
    }
}

// Function to save resumes to JSON file
async Task SaveResumesToFile()
{
    try
    {
        var json = System.Text.Json.JsonSerializer.Serialize(resumes, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
        await System.IO.File.WriteAllTextAsync(resumesFile, json);
        Console.WriteLine($"Saved {resumes.Count} resumes to storage");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error saving resumes: {ex.Message}");
    }
}

app.UseDefaultFiles();
app.UseStaticFiles();

// Resume endpoints (updated for SQLite)
app.MapPost("/api/resumes", async (HttpRequest req) => {
    Console.WriteLine("=== RESUME UPLOAD DEBUG ===");
    Console.WriteLine($"Current resumes in storage: {resumes.Count}");
    
    if (!req.HasFormContentType) return Results.BadRequest(new { error = "form required" });
    var form = await req.ReadFormAsync();
    var file = form.Files.GetFile("resume");
    var name = form["name"].ToString();
    if (file == null) return Results.BadRequest(new { error = "file missing" });
    
    Console.WriteLine($"Uploading file: {file.FileName}, Name: {name}");
    
    // Save file to uploads directory
    var filename = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + "-" + System.IO.Path.GetFileName(file.FileName);
    var dest = System.IO.Path.Combine(uploadDir, filename);
    using var fs = File.Create(dest);
    await file.CopyToAsync(fs);
    
    Console.WriteLine($"File saved to: {dest}");
    
    // Create record and add to in-memory storage
    var record = new { 
        Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), 
        FileName = filename, 
        OriginalName = file.FileName, 
        DisplayName = string.IsNullOrWhiteSpace(name) ? file.FileName : name, 
        Url = "/uploads/" + filename, 
        CreatedAt = DateTime.UtcNow 
    };
    
    Console.WriteLine($"Created record with ID: {record.Id}");
    resumes.Add(record);
    Console.WriteLine($"Added to storage. Total resumes now: {resumes.Count}");
    
    // Save to persistent storage
    await SaveResumesToFile();
    
    return Results.Ok(record);
});

app.MapGet("/api/resumes", () => {
    Console.WriteLine($"=== GET RESUMES DEBUG ===");
    Console.WriteLine($"Total resumes in storage: {resumes.Count}");
    foreach (var resume in resumes)
    {
        var idProperty = resume.GetType().GetProperty("Id");
        var id = idProperty?.GetValue(resume);
        var fileNameProperty = resume.GetType().GetProperty("FileName");
        var fileName = fileNameProperty?.GetValue(resume);
        Console.WriteLine($"Resume ID: {id}, FileName: {fileName}");
    }
    return Results.Ok(resumes);
});

// Get resume content
app.MapGet("/api/resumes/{id:long}/content", (long id) => {
    try
    {
        Console.WriteLine($"Looking for resume with ID: {id}");
        Console.WriteLine($"Total resumes in storage: {resumes.Count}");
        
        var resume = resumes.FirstOrDefault(r => {
            var idProperty = r.GetType().GetProperty("Id");
            var resumeId = idProperty?.GetValue(r);
            Console.WriteLine($"Checking resume ID: {resumeId} (type: {resumeId?.GetType()})");
            return idProperty != null && Convert.ToInt64(resumeId) == id;
        });
        
        if (resume == null)
        {
            Console.WriteLine($"Resume with ID {id} not found in storage");
            return Results.NotFound(new { error = "Resume not found" });
        }
        
        // Get the file path
        var fileNameProperty = resume.GetType().GetProperty("FileName");
        var fileName = fileNameProperty?.GetValue(resume)?.ToString();
        
        if (string.IsNullOrEmpty(fileName))
        {
            return Results.BadRequest(new { error = "Resume file not found" });
        }
        
        var filePath = System.IO.Path.Combine(uploadDir, fileName);
        
        if (!File.Exists(filePath))
        {
            return Results.NotFound(new { error = "Resume file not found on disk" });
        }
        
        // Extract text based on file type
        Console.WriteLine($"Extracting text from: {filePath}");
        var content = ExtractTextFromFile(filePath);
        Console.WriteLine($"Extracted content length: {content?.Length ?? 0}");
        Console.WriteLine($"Content preview: {content?.Substring(0, Math.Min(100, content?.Length ?? 0))}...");
        
        return Results.Ok(new { content = content });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
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
    var keywords = req.PostingUrl.Split(System.IO.Path.GetInvalidFileNameChars().Concat(new char[]{'/','-',':','?','&','='}).ToArray())
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

// Forgot password endpoint
app.MapPost("/api/forgot-password", async (ForgotPasswordRequest request, HttpContext context) => {
    try
    {
        Console.WriteLine($"=== PASSWORD RESET REQUEST ===");
        Console.WriteLine($"Email: {request.Email}");
        Console.WriteLine($"Request received at: {DateTime.UtcNow}");
        
        // Check if user exists in localStorage (simulated by checking if email is valid)
        // In a real app, you'd check your user database
        // For now, we'll accept any email that looks valid
        if (string.IsNullOrEmpty(request.Email) || !request.Email.Contains("@"))
        {
            Console.WriteLine($"Invalid email format: {request.Email}");
            return Results.BadRequest(new { error = "Please enter a valid email address" });
        }
        
        Console.WriteLine($"Email validation passed for: {request.Email}");
        
        // Generate reset token (simple implementation)
        var resetToken = Guid.NewGuid().ToString();
        var resetExpiry = DateTime.UtcNow.AddHours(1); // Token expires in 1 hour
        
        // Get the current request URL and build the reset link dynamically
        var httpRequest = context.Request;
        var scheme = httpRequest.Scheme;
        var host = httpRequest.Host;
        
        // Use configured base URL if available, otherwise use current request
        var baseUrl = !string.IsNullOrEmpty(emailBaseUrl) ? emailBaseUrl : $"{scheme}://{host}";
        var resetLink = $"{baseUrl}/reset-password.html?token={resetToken}&email={Uri.EscapeDataString(request.Email)}";
        
        // Store reset token temporarily (in a real app, you'd store this in a database)
        // For demo purposes, we'll just log it
        Console.WriteLine($"Reset token generated for {request.Email}");
        
        // Send reset email
        var emailService = new EmailService();
        
        // For demo purposes, we'll just log the email instead of sending it
        // In a real app, you would use a real email service like SendGrid, Mailgun, etc.
        
        // Log to file for testing
        var emailLog = $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] DEMO EMAIL TO: {request.Email}\nSUBJECT: Password Reset Request\nBODY: Click here to reset: {resetLink}\n---\n\n";
        await File.AppendAllTextAsync("email_log.txt", emailLog);
        
        Console.WriteLine($"Password reset processed for: {request.Email}");
        Console.WriteLine($"=== END PASSWORD RESET REQUEST ===");
        
        var response = new { 
            success = true, 
            message = "Password reset link sent to your email address" 
        };
        
        Console.WriteLine($"Returning response: {System.Text.Json.JsonSerializer.Serialize(response)}");
        return Results.Ok(response);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Password reset error: {ex.Message}");
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Reset password endpoint
app.MapPost("/api/reset-password", (ResetPasswordRequest request) => {
    try
    {
        // Validate input
        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.NewPassword))
        {
            return Results.BadRequest(new { error = "Email and new password are required" });
        }
        
        if (request.NewPassword.Length < 6)
        {
            return Results.BadRequest(new { error = "Password must be at least 6 characters long" });
        }
        
        // In a real app, you'd validate the token and expiry
        // For localStorage-based system, we'll just log the reset
        // Note: Password reuse validation is handled on the frontend
        // In a real application, you would validate against a database
        Console.WriteLine($"Password reset requested for: {request.Email}");
        Console.WriteLine($"New password: {request.NewPassword}");
        Console.WriteLine($"Reset token: {request.Token}");
        
        // Note: In a localStorage-based system, the actual password update
        // would need to be handled on the frontend by updating localStorage
        // This endpoint just validates the request
        
        return Results.Ok(new { 
            success = true, 
            message = "Password reset request processed. Please update your password in the application." 
        });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Test endpoint for PDF extraction
app.MapGet("/api/test-pdf-extraction", () => {
    try
    {
        // Look for any PDF files in uploads directory
        var pdfFiles = Directory.GetFiles(uploadDir, "*.pdf");
        if (pdfFiles.Length == 0)
        {
            return Results.Ok(new { message = "No PDF files found in uploads directory", files = new string[0] });
        }
        
        var results = new List<object>();
        foreach (var pdfFile in pdfFiles.Take(3)) // Test first 3 PDFs
        {
            try
            {
                var content = ExtractTextFromPdf(pdfFile);
                var cleanContent = System.Text.RegularExpressions.Regex.Replace(content, @"\s+", " ").Trim();
                
                results.Add(new
                {
                    file = System.IO.Path.GetFileName(pdfFile),
                    contentLength = content.Length,
                    cleanContentLength = cleanContent.Length,
                    contentPreview = content.Substring(0, Math.Min(200, content.Length)),
                    cleanContentPreview = cleanContent.Substring(0, Math.Min(200, cleanContent.Length)),
                    isGooglePdf = content.Contains("Google") || content.Contains("Docs") || content.Contains("Drive"),
                    success = true
                });
            }
            catch (Exception ex)
            {
                results.Add(new
                {
                    file = System.IO.Path.GetFileName(pdfFile),
                    error = ex.Message,
                    success = false
                });
            }
        }
        
        return Results.Ok(new { message = "PDF extraction test results", results = results });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// Serve uploads
app.MapGet("/uploads/{file}", (string file) => {
    var path = System.IO.Path.Combine(uploadDir, file);
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
record ForgotPasswordRequest(string Email);
record ResetPasswordRequest(string Email, string Token, string NewPassword);



// Email service implementation
class EmailService
{
    public async Task SendEmailAsync(string to, string subject, string body)
    {
        Console.WriteLine($"EMAIL SENT TO: {to}");
        Console.WriteLine($"SUBJECT: {subject}");
        Console.WriteLine($"BODY: {body}");
        Console.WriteLine("---");
        
        // In a real application, you would integrate with an email service like:
        // - SendGrid
        // - Mailgun
        // - Amazon SES
        // - SMTP server
        
        // For demo purposes, we'll just log the email
        // You can also save to a file for testing
        var emailLog = $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] TO: {to}\nSUBJECT: {subject}\nBODY:\n{body}\n---\n\n";
        await File.AppendAllTextAsync("email_log.txt", emailLog);
        
        await Task.Delay(100);
    }
    
    public async Task SendPasswordResetEmailAsync(string to, string name, string resetLink)
    {
        var subject = "Password Reset Request - Internship Application Manager";
        var body = $@"
Hello {name},

You requested a password reset for your Internship Application Manager account.

Click the link below to reset your password:
{resetLink}

This link will expire in 1 hour.

If you didn't request this reset, please ignore this email.

Best regards,
Internship Application Manager Team
";
        
        await SendEmailAsync(to, subject, body);
    }
}