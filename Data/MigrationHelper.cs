using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using InternApp.Models;

namespace InternApp.Data;

public static class MigrationHelper
{
    public static async Task MigrateFromJsonAsync(ApplicationDbContext context, string jsonFilePath)
    {
        if (!File.Exists(jsonFilePath))
            return;

        try
        {
            var jsonContent = await File.ReadAllTextAsync(jsonFilePath);
            var jsonData = JsonSerializer.Deserialize<JsonData>(jsonContent);
            
            if (jsonData?.Users == null)
                return;

            foreach (var userData in jsonData.Users)
            {
                var userId = userData.Key;
                
                // Migrate resumes
                foreach (var resume in userData.Value.Resumes)
                {
                    var newResume = new Resume
                    {
                        Id = resume.Id,
                        UserId = userId,
                        FileName = resume.FileName,
                        OriginalName = resume.OriginalName,
                        DisplayName = resume.DisplayName,
                        CreatedAt = resume.CreatedAt
                    };
                    
                    // Check if resume already exists
                    var existingResume = await context.Resumes
                        .FirstOrDefaultAsync(r => r.Id == resume.Id && r.UserId == userId);
                    
                    if (existingResume == null)
                    {
                        context.Resumes.Add(newResume);
                    }
                }
                
                // Migrate postings
                foreach (var posting in userData.Value.Postings)
                {
                    var newPosting = new Posting
                    {
                        Id = posting.Id,
                        UserId = userId,
                        Title = posting.Title,
                        Company = posting.Company,
                        Description = posting.Description,
                        DueDate = posting.DueDate,
                        Status = posting.Status,
                        CreatedAt = posting.CreatedAt
                    };
                    
                    // Check if posting already exists
                    var existingPosting = await context.Postings
                        .FirstOrDefaultAsync(p => p.Id == posting.Id && p.UserId == userId);
                    
                    if (existingPosting == null)
                    {
                        context.Postings.Add(newPosting);
                    }
                }
            }
            
            await context.SaveChangesAsync();
            Console.WriteLine("Data migration completed successfully!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Migration failed: {ex.Message}");
        }
    }
    
    private class JsonData
    {
        public Dictionary<string, UserData>? Users { get; set; }
    }
    
    private class UserData
    {
        public List<JsonResume> Resumes { get; set; } = new();
        public List<JsonPosting> Postings { get; set; } = new();
    }
    
    private record JsonResume(int Id, string FileName, string OriginalName, string? DisplayName, DateTime CreatedAt);
    private record JsonPosting(int Id, string Title, string Company, string Description, string? DueDate, string Status, DateTime CreatedAt);
}
