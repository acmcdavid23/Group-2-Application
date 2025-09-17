Internship Application Manager (C# prototype)

Prerequisites:
- .NET 7 SDK (or compatible)

Run:

1. From repository root run:

   dotnet run --project InternApp.csproj

2. Open in your browser:

   http://localhost:5000/

What this prototype provides:
- Resume upload and listing (files saved to `uploads/`).
- Add internship postings with optional due dates.
- Calendar view showing posting due dates (FullCalendar).
- A mocked "tailor" endpoint that returns keywords from the posting URL.

Notes:
- This is a prototype. Integrate a proper DB and LLM service for production.
