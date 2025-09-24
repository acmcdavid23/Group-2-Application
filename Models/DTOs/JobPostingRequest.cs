namespace InternApp.Models.DTOs
{
    public class JobPostingRequest
    {
        public int UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Company { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public string Status { get; set; } = "interested";
        public EmailNotificationRequest? EmailNotification { get; set; }
    }
    
    public class EmailNotificationRequest
    {
        public string EmailAddress { get; set; } = string.Empty;
        public string Timing { get; set; } = "1_day";
    }
}
