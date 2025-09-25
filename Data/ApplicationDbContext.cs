using Microsoft.EntityFrameworkCore;
using InternApp.Models;

namespace InternApp.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Resume> Resumes { get; set; }
    public DbSet<Posting> Postings { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure User entity
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Name).HasMaxLength(100);
            entity.Property(u => u.Email).HasMaxLength(255);
            entity.Property(u => u.PasswordHash).HasMaxLength(255);
        });

        // Configure user isolation
        modelBuilder.Entity<Resume>()
            .HasIndex(r => r.UserId)
            .HasDatabaseName("IX_Resumes_UserId");

        modelBuilder.Entity<Posting>()
            .HasIndex(p => p.UserId)
            .HasDatabaseName("IX_Postings_UserId");

        // Configure relationships and constraints
        modelBuilder.Entity<Resume>(entity =>
        {
            entity.Property(r => r.UserId).HasMaxLength(50);
            entity.Property(r => r.FileName).HasMaxLength(255);
            entity.Property(r => r.OriginalName).HasMaxLength(255);
            entity.Property(r => r.DisplayName).HasMaxLength(255);
        });

        modelBuilder.Entity<Posting>(entity =>
        {
            entity.Property(p => p.UserId).HasMaxLength(50);
            entity.Property(p => p.Title).HasMaxLength(255);
            entity.Property(p => p.Company).HasMaxLength(255);
            entity.Property(p => p.Description).HasMaxLength(2000);
            entity.Property(p => p.DueDate).HasMaxLength(50);
            entity.Property(p => p.Status).HasMaxLength(50);
        });
    }
}
