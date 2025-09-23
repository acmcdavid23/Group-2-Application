Internship Application Manager (C# prototype)

Prerequisites:
- .NET 7 SDK (or compatible)
- Ollama

Run:

1. From repository root run:

   dotnet run --project InternApp.csproj

2. Open in your browser:

   http://localhost:5000/

**🦙 Setting Up Ollama for Local AI Assistant**
[Download the Ollama Setup Guide (PDF)](./docs/Ollama_Setup_Guide_Final.pdf)

Ollama is the local AI backend that powers the resume assistant in this project.
Follow these steps to install it and pull the required model.

1. Download Ollama (Windows & Mac)

Windows:
Download OllamaSetup.exe from ollama.com/download
Click Install and follow the prompts. Allow Ollama to add itself to PATH if prompted.

macOS:
Download the .dmg, drag Ollama to Applications, then open it.

2. Start Ollama
Option 1: GUI App (Recommended):
Open Ollama from Start Menu (Windows) or Applications (Mac). Keep it open while using the project.

Option 2: Command Line: ollama serve

3. Download the Required Models

This app uses the llama3.1:8b model. You have two options:

Via the Ollama App:
   Search for llama3.1:8b and download it.

Via Command Prompt / Terminal:
   ollama pull llama3.1:8b

4. Use with the App

Make sure both Ollama and the Internship Application Manager are running.

Ollama provides the AI backend, while your .NET app provides the interface.

Open http://localhost:5000/ai.html to chat with the AI Assistant.

**What this Prototype Provides**

Resume upload and listing (files saved to uploads/)

Add internship postings with optional due dates

Calendar view showing posting due dates (FullCalendar)

Mock “tailor” endpoint that returns keywords from posting URLs

Local AI integration to help tailor your resume/job postings