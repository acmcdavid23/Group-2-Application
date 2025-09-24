namespace InternApp.Models
{
    public class EmailNotification
    {
        public int Id { get; set; }
        public int PostingId { get; set; }
        public string EmailAddress { get; set; } = string.Empty;
        public string Timing { get; set; } = "1_day";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation property
        public JobPosting? Posting { get; set; }
    }
}
