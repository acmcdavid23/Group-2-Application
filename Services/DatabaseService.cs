using Microsoft.Data.Sqlite;
using InternApp.Models;
using InternApp.Models.DTOs;

namespace InternApp.Services
{
    public class DatabaseService
    {
        private readonly string _connectionString;
        
        public DatabaseService()
        {
            _connectionString = "Data Source=internship_app.db";
            InitializeDatabase();
        }
        
        private void InitializeDatabase()
        {
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();
            
            // Create Users table
            var createUsersTable = @"
                CREATE TABLE IF NOT EXISTS Users (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    Email TEXT UNIQUE NOT NULL,
                    Password TEXT NOT NULL,
                    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    IsDemo BOOLEAN DEFAULT 0
                )";
                
            // Create JobPostings table
            var createJobPostingsTable = @"
                CREATE TABLE IF NOT EXISTS JobPostings (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    UserId INTEGER NOT NULL,
                    Title TEXT NOT NULL,
                    Company TEXT NOT NULL,
                    Description TEXT,
                    DueDate DATE,
                    Status TEXT NOT NULL,
                    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (UserId) REFERENCES Users(Id)
                )";
                
            // Create EmailNotifications table
            var createEmailNotificationsTable = @"
                CREATE TABLE IF NOT EXISTS EmailNotifications (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    PostingId INTEGER NOT NULL,
                    EmailAddress TEXT NOT NULL,
                    Timing TEXT NOT NULL,
                    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (PostingId) REFERENCES JobPostings(Id)
                )";
                
            // Create CalendarEvents table
            var createCalendarEventsTable = @"
                CREATE TABLE IF NOT EXISTS CalendarEvents (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    UserId INTEGER NOT NULL,
                    Title TEXT NOT NULL,
                    StartDate DATE NOT NULL,
                    EndDate DATE,
                    Description TEXT,
                    Color TEXT DEFAULT '#3b82f6',
                    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (UserId) REFERENCES Users(Id)
                )";
            
            using var command = new SqliteCommand(createUsersTable, connection);
            command.ExecuteNonQuery();
            
            command.CommandText = createJobPostingsTable;
            command.ExecuteNonQuery();
            
            command.CommandText = createEmailNotificationsTable;
            command.ExecuteNonQuery();
            
            command.CommandText = createCalendarEventsTable;
            command.ExecuteNonQuery();
            
            // Insert demo user if not exists
            InsertDemoUserIfNotExists(connection);
        }
        
        private void InsertDemoUserIfNotExists(SqliteConnection connection)
        {
            var checkDemoUser = "SELECT COUNT(*) FROM Users WHERE Email = 'demo@example.com'";
            using var checkCommand = new SqliteCommand(checkDemoUser, connection);
            var count = Convert.ToInt32(checkCommand.ExecuteScalar());
            
            if (count == 0)
            {
                var insertDemoUser = @"
                    INSERT INTO Users (Email, Password, IsDemo) 
                    VALUES ('demo@example.com', 'demo123', 1)";
                using var insertCommand = new SqliteCommand(insertDemoUser, connection);
                insertCommand.ExecuteNonQuery();
                
                // Insert sample job postings for demo user
                InsertSampleData(connection);
            }
        }
        
        private void InsertSampleData(SqliteConnection connection)
        {
            var getDemoUserId = "SELECT Id FROM Users WHERE Email = 'demo@example.com'";
            using var getUserIdCommand = new SqliteCommand(getDemoUserId, connection);
            var userId = Convert.ToInt32(getUserIdCommand.ExecuteScalar());
            
            var samplePostings = new[]
            {
                ("Software Engineer Intern", "TechCorp", "Full-stack development internship", "2024-02-15", "applied"),
                ("Data Science Intern", "DataSoft", "Machine learning and data analysis", "2024-02-20", "interested"),
                ("Marketing Intern", "BrandCo", "Digital marketing and social media", "2024-02-25", "phone_screen")
            };
            
            foreach (var (title, company, description, dueDate, status) in samplePostings)
            {
                var insertPosting = @"
                    INSERT INTO JobPostings (UserId, Title, Company, Description, DueDate, Status)
                    VALUES (@userId, @title, @company, @description, @dueDate, @status)";
                    
                using var command = new SqliteCommand(insertPosting, connection);
                command.Parameters.AddWithValue("@userId", userId);
                command.Parameters.AddWithValue("@title", title);
                command.Parameters.AddWithValue("@company", company);
                command.Parameters.AddWithValue("@description", description);
                command.Parameters.AddWithValue("@dueDate", dueDate);
                command.Parameters.AddWithValue("@status", status);
                command.ExecuteNonQuery();
            }
        }
        
        // User operations
        public async Task<User?> GetUserByEmailAsync(string email)
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();
            
            var command = new SqliteCommand("SELECT * FROM Users WHERE Email = @email", connection);
            command.Parameters.AddWithValue("@email", email);
            
            using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new User
                {
                    Id = reader.GetInt32(0),
                    Email = reader.GetString(1),
                    Password = reader.GetString(2),
                    CreatedAt = reader.GetDateTime(3),
                    IsDemo = reader.GetInt32(4) == 1
                };
            }
            return null;
        }
        
        public async Task<User> CreateUserAsync(UserRequest request)
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();
            
            var command = new SqliteCommand(
                "INSERT INTO Users (Email, Password) VALUES (@email, @password); SELECT last_insert_rowid();",
                connection);
            command.Parameters.AddWithValue("@email", request.Email);
            command.Parameters.AddWithValue("@password", request.Password);
            
            var userId = Convert.ToInt32(await command.ExecuteScalarAsync());
            
            return new User
            {
                Id = userId,
                Email = request.Email,
                Password = request.Password,
                CreatedAt = DateTime.UtcNow
            };
        }
        
        // Job Posting operations
        public async Task<List<JobPosting>> GetJobPostingsByUserIdAsync(int userId)
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();
            
            var command = new SqliteCommand(@"
                SELECT jp.*, en.EmailAddress, en.Timing 
                FROM JobPostings jp 
                LEFT JOIN EmailNotifications en ON jp.Id = en.PostingId 
                WHERE jp.UserId = @userId 
                ORDER BY jp.CreatedAt DESC", connection);
            command.Parameters.AddWithValue("@userId", userId);
            
            var postings = new List<JobPosting>();
            using var reader = await command.ExecuteReaderAsync();
            
            while (await reader.ReadAsync())
            {
                var posting = new JobPosting
                {
                    Id = reader.GetInt32(0),
                    UserId = reader.GetInt32(1),
                    Title = reader.GetString(2),
                    Company = reader.GetString(3),
                    Description = reader.GetString(4),
                    DueDate = reader.IsDBNull(5) ? null : reader.GetDateTime(5),
                    Status = reader.GetString(6),
                    CreatedAt = reader.GetDateTime(7)
                };
                
                if (!reader.IsDBNull(8))
                {
                    posting.EmailNotification = new EmailNotification
                    {
                        EmailAddress = reader.GetString(8),
                        Timing = reader.GetString(9)
                    };
                }
                
                postings.Add(posting);
            }
            
            return postings;
        }
        
        public async Task<JobPosting> CreateJobPostingAsync(JobPostingRequest request)
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();
            
            using var transaction = connection.BeginTransaction();
            
            try
            {
                // Insert job posting
                var insertPostingCommand = new SqliteCommand(@"
                    INSERT INTO JobPostings (UserId, Title, Company, Description, DueDate, Status)
                    VALUES (@userId, @title, @company, @description, @dueDate, @status);
                    SELECT last_insert_rowid();", connection, transaction);
                    
                insertPostingCommand.Parameters.AddWithValue("@userId", request.UserId);
                insertPostingCommand.Parameters.AddWithValue("@title", request.Title);
                insertPostingCommand.Parameters.AddWithValue("@company", request.Company);
                insertPostingCommand.Parameters.AddWithValue("@description", request.Description);
                insertPostingCommand.Parameters.AddWithValue("@dueDate", request.DueDate);
                insertPostingCommand.Parameters.AddWithValue("@status", request.Status);
                
                var postingId = Convert.ToInt32(await insertPostingCommand.ExecuteScalarAsync());
                
                // Insert email notification if provided
                if (request.EmailNotification != null)
                {
                    var insertNotificationCommand = new SqliteCommand(@"
                        INSERT INTO EmailNotifications (PostingId, EmailAddress, Timing)
                        VALUES (@postingId, @emailAddress, @timing)", connection, transaction);
                        
                    insertNotificationCommand.Parameters.AddWithValue("@postingId", postingId);
                    insertNotificationCommand.Parameters.AddWithValue("@emailAddress", request.EmailNotification.EmailAddress);
                    insertNotificationCommand.Parameters.AddWithValue("@timing", request.EmailNotification.Timing);
                    
                    await insertNotificationCommand.ExecuteNonQueryAsync();
                }
                
                transaction.Commit();
                
                return new JobPosting
                {
                    Id = postingId,
                    UserId = request.UserId,
                    Title = request.Title,
                    Company = request.Company,
                    Description = request.Description,
                    DueDate = request.DueDate,
                    Status = request.Status,
                    CreatedAt = DateTime.UtcNow
                };
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }
        
        public async Task<JobPosting?> UpdateJobPostingAsync(int id, JobPostingRequest request)
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();
            
            using var transaction = connection.BeginTransaction();
            
            try
            {
                // Update job posting
                var updateCommand = new SqliteCommand(@"
                    UPDATE JobPostings 
                    SET Title = @title, Company = @company, Description = @description, 
                        DueDate = @dueDate, Status = @status 
                    WHERE Id = @id", connection, transaction);
                    
                updateCommand.Parameters.AddWithValue("@id", id);
                updateCommand.Parameters.AddWithValue("@title", request.Title);
                updateCommand.Parameters.AddWithValue("@company", request.Company);
                updateCommand.Parameters.AddWithValue("@description", request.Description);
                updateCommand.Parameters.AddWithValue("@dueDate", request.DueDate);
                updateCommand.Parameters.AddWithValue("@status", request.Status);
                
                var rowsAffected = await updateCommand.ExecuteNonQueryAsync();
                if (rowsAffected == 0) return null;
                
                // Update email notification
                var deleteNotificationCommand = new SqliteCommand(
                    "DELETE FROM EmailNotifications WHERE PostingId = @postingId", 
                    connection, transaction);
                deleteNotificationCommand.Parameters.AddWithValue("@postingId", id);
                await deleteNotificationCommand.ExecuteNonQueryAsync();
                
                if (request.EmailNotification != null)
                {
                    var insertNotificationCommand = new SqliteCommand(@"
                        INSERT INTO EmailNotifications (PostingId, EmailAddress, Timing)
                        VALUES (@postingId, @emailAddress, @timing)", connection, transaction);
                        
                    insertNotificationCommand.Parameters.AddWithValue("@postingId", id);
                    insertNotificationCommand.Parameters.AddWithValue("@emailAddress", request.EmailNotification.EmailAddress);
                    insertNotificationCommand.Parameters.AddWithValue("@timing", request.EmailNotification.Timing);
                    
                    await insertNotificationCommand.ExecuteNonQueryAsync();
                }
                
                transaction.Commit();
                
                return new JobPosting
                {
                    Id = id,
                    UserId = request.UserId,
                    Title = request.Title,
                    Company = request.Company,
                    Description = request.Description,
                    DueDate = request.DueDate,
                    Status = request.Status,
                    CreatedAt = DateTime.UtcNow
                };
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }
        
        public async Task<bool> DeleteJobPostingAsync(int id)
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();
            
            using var transaction = connection.BeginTransaction();
            
            try
            {
                // Delete email notifications first
                var deleteNotificationsCommand = new SqliteCommand(
                    "DELETE FROM EmailNotifications WHERE PostingId = @id", 
                    connection, transaction);
                deleteNotificationsCommand.Parameters.AddWithValue("@id", id);
                await deleteNotificationsCommand.ExecuteNonQueryAsync();
                
                // Delete job posting
                var deletePostingCommand = new SqliteCommand(
                    "DELETE FROM JobPostings WHERE Id = @id", 
                    connection, transaction);
                deletePostingCommand.Parameters.AddWithValue("@id", id);
                
                var rowsAffected = await deletePostingCommand.ExecuteNonQueryAsync();
                transaction.Commit();
                
                return rowsAffected > 0;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }
        
        // Calendar Event operations
        public async Task<List<CalendarEvent>> GetCalendarEventsByUserIdAsync(int userId)
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();
            
            var command = new SqliteCommand(@"
                SELECT * FROM CalendarEvents 
                WHERE UserId = @userId 
                ORDER BY StartDate ASC", connection);
            command.Parameters.AddWithValue("@userId", userId);
            
            var events = new List<CalendarEvent>();
            using var reader = await command.ExecuteReaderAsync();
            
            while (await reader.ReadAsync())
            {
                events.Add(new CalendarEvent
                {
                    Id = reader.GetInt32(0),
                    UserId = reader.GetInt32(1),
                    Title = reader.GetString(2),
                    StartDate = reader.GetDateTime(3),
                    EndDate = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
                    Description = reader.GetString(5),
                    Color = reader.GetString(6),
                    CreatedAt = reader.GetDateTime(7)
                });
            }
            
            return events;
        }
        
        public async Task<CalendarEvent> CreateCalendarEventAsync(CalendarEventRequest request)
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();
            
            var command = new SqliteCommand(@"
                INSERT INTO CalendarEvents (UserId, Title, StartDate, EndDate, Description, Color)
                VALUES (@userId, @title, @startDate, @endDate, @description, @color);
                SELECT last_insert_rowid();", connection);
                
            command.Parameters.AddWithValue("@userId", request.UserId);
            command.Parameters.AddWithValue("@title", request.Title);
            command.Parameters.AddWithValue("@startDate", request.StartDate);
            command.Parameters.AddWithValue("@endDate", request.EndDate);
            command.Parameters.AddWithValue("@description", request.Description);
            command.Parameters.AddWithValue("@color", request.Color);
            
            var eventId = Convert.ToInt32(await command.ExecuteScalarAsync());
            
            return new CalendarEvent
            {
                Id = eventId,
                UserId = request.UserId,
                Title = request.Title,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Description = request.Description,
                Color = request.Color,
                CreatedAt = DateTime.UtcNow
            };
        }
    }
}
