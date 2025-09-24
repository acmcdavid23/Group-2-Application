namespace InternApp.Models.DTOs
{
    public class CalendarEventRequest
    {
        public int UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Color { get; set; } = "#3b82f6";
    }
}
