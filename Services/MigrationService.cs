using InternApp.Models;
using InternApp.Models.DTOs;

namespace InternApp.Services
{
    public class MigrationService
    {
        private readonly DatabaseService _dbService;
        
        public MigrationService(DatabaseService dbService)
        {
            _dbService = dbService;
        }
        
        public async Task<bool> MigrateLocalStorageDataAsync(string localStorageData)
        {
            try
            {
                if (string.IsNullOrEmpty(localStorageData))
                    return false;
                
                // Parse localStorage data (this would need to be adapted based on your actual localStorage structure)
                var data = System.Text.Json.JsonSerializer.Deserialize<LocalStorageData>(localStorageData);
                if (data == null)
                    return false;
                
                // Create user if not exists
                var user = await _dbService.GetUserByEmailAsync(data.UserEmail);
                if (user == null)
                {
                    var userRequest = new UserRequest
                    {
                        Email = data.UserEmail,
                        Password = "migrated_user" // Default password for migrated users
                    };
                    user = await _dbService.CreateUserAsync(userRequest);
                }
                
                // Migrate job postings
                if (data.JobPostings != null)
                {
                    foreach (var posting in data.JobPostings)
                    {
                        var postingRequest = new JobPostingRequest
                        {
                            UserId = user.Id,
                            Title = posting.Title,
                            Company = posting.Company,
                            Description = posting.Description,
                            DueDate = posting.DueDate,
                            Status = posting.Status,
                            EmailNotification = posting.EmailNotification != null ? new EmailNotificationRequest
                            {
                                EmailAddress = posting.EmailNotification.EmailAddress,
                                Timing = posting.EmailNotification.Timing
                            } : null
                        };
                        
                        await _dbService.CreateJobPostingAsync(postingRequest);
                    }
                }
                
                // Migrate calendar events
                if (data.CalendarEvents != null)
                {
                    foreach (var calendarEvent in data.CalendarEvents)
                    {
                        var eventRequest = new CalendarEventRequest
                        {
                            UserId = user.Id,
                            Title = calendarEvent.Title,
                            StartDate = calendarEvent.StartDate,
                            EndDate = calendarEvent.EndDate,
                            Description = calendarEvent.Description,
                            Color = calendarEvent.Color
                        };
                        
                        await _dbService.CreateCalendarEventAsync(eventRequest);
                    }
                }
                
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Migration failed: {ex.Message}");
                return false;
            }
        }
    }
    
    // Data structures to match localStorage format
    public class LocalStorageData
    {
        public string UserEmail { get; set; } = string.Empty;
        public List<LocalStorageJobPosting>? JobPostings { get; set; }
        public List<LocalStorageCalendarEvent>? CalendarEvents { get; set; }
    }
    
    public class LocalStorageJobPosting
    {
        public string Title { get; set; } = string.Empty;
        public string Company { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public LocalStorageEmailNotification? EmailNotification { get; set; }
    }
    
    public class LocalStorageEmailNotification
    {
        public string EmailAddress { get; set; } = string.Empty;
        public string Timing { get; set; } = string.Empty;
    }
    
    public class LocalStorageCalendarEvent
    {
        public string Title { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
    }
}
