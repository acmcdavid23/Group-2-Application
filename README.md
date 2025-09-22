Internship Application Manager (C# prototype)

Prerequisites:
- .NET 7 SDK (or compatible)

Run:

1. From repository root run:

   dotnet run --project InternApp.csproj

2. Open in your browser:

   http://localhost:5000/

🦙 Setting Up Ollama for Local AI Assistant

Prerequisites

1. **Install Ollama**

   - **Windows/macOS:** Download and install from [https://ollama.com/download](https://ollama.com/download)
   - **Linux:**  
     ```sh
     curl -fsSL https://ollama.com/install.sh | sh
     ```

2. **Pull the Required Models**
   After installing Ollama, close all open terminals and open a new one before running `ollama serve`. This ensures your system recognizes the new command.
   Open a terminal and run:
   ollama pull llama3.1:8b
   ollama pull nomic-embed-text

3. Running Ollama
   ollama serve
   This will start the Ollama API at [http://localhost:11434](http://localhost:11434).

4. Insure that both Ollama and the Program is running for full functionality.
   Open the Ollama app (or run `ollama serve` in a terminal).
   Keep the Ollama app open while using this project.

What this prototype provides:
- Resume upload and listing (files saved to `uploads/`).
- Add internship postings with optional due dates.
- Calendar view showing posting due dates (FullCalendar).
- A mocked "tailor" endpoint that returns keywords from the posting URL.
- A local Ai to help tailor your resume/job postings

Notes:
- This is a prototype. Integrate a proper DB and LLM service for production.
