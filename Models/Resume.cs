using System.ComponentModel.DataAnnotations;

namespace InternApp.Models;

public class Resume
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    public string FileName { get; set; } = string.Empty;
    
    [Required]
    public string OriginalName { get; set; } = string.Empty;
    
    public string? DisplayName { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
