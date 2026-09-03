# Yokai AI 🪄📄

> **AI-Powered Word Document (`.docx`) Formatting & Completion Engine**  
> Fill technical lab experiments, research papers, and structured reports with multimodal AI while keeping **100% of the original document layout, tables, fonts, and spacing intact**.

[![License: Non-Commercial](https://img.shields.io/badge/License-Source--Available%20Non--Commercial-blue.svg)](LICENSE)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%206%20%7C%20Tailwind-61dafb.svg)](src/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20python--docx%20%7C%20OpenXML-009688.svg)](docs/ARCHITECTURE.md)
[![AI Providers](https://img.shields.io/badge/AI-NVIDIA%20NIM%20%7C%20OpenCode%20%7C%20Gemini-76b900.svg)](docs/SAMPLE_CODE.md)

---

## 🌟 Key Highlights

- **100% Format Preservation**: Uses low-level **In-Place OOXML Run-Level Mutation** (`<w:t>` replacement inside `<w:r>`). Never converts `.docx` to markdown or HTML, ensuring original font families, weights, table borders, margins, and headers/footers never shift.
- **ChatGPT-Style Unified Workspace**: Single-screen desktop dashboard at 100% zoom with integrated image attachments, prompt suggestion chips, AI enhancement, and inline generation controls.
- **Multimodal Diagram & Photo Embedding**: Upload circuit diagrams, network topologies, or charts; the engine calculates proportional **EMU** (English Metric Unit) dimensions and injects `<w:drawing>` objects into target placeholders without distortion.
- **3-Tier AI Fallback Engine**: Cascaded failover architecture guarantees 99.9% uptime:
  1. **Tier 1 (Primary)**: **NVIDIA NIM** (`meta/llama-3.2-90b-vision-instruct` / `11b`)
  2. **Tier 2 (Fallback)**: **OpenCode Zen API** (`mimo-v2.5-free` / `muse-spark-1.2-contributor-free`)
  3. **Tier 3 (Safety Net)**: **Google Gemini API** (`gemini-2.5-flash`)
- **Enterprise-Grade Security**: Anti-Zip-Bomb decompression checks, binary magic-byte sniffing (`PK\x03\x04`), path traversal shields, Bcrypt password cryptography, and SlowAPI rate limiting.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT (React 19 + Vite 6)                      │
│   • Single-Screen Desktop Dashboard       • ChatGPT-Style Input Bar   │
│   • Inline Image Attachments              • Real-Time SSE Status View  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS + Bearer JWT
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY & SECURITY PERIMETER                    │
│   • SlowAPI Sliding-Window Rate Limiter   • Magic-Byte File Sniffer    │
│   • Anti-Zip-Bomb Decompression Guard     • Path Traversal Shield      │
│   • Security Headers (HSTS, CSP, nosniff) • JWT Access Verification    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Validated Job Request
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      ASYNC JOB & PIPELINE RUNNER                       │
│             (FastAPI Background Workers / AsyncIO Pipeline)            │
└──────────────┬──────────────────────────────────────────┬──────────────┘
               │                                          │
               ▼                                          ▼
┌──────────────────────────────┐          ┌──────────────────────────────┐
│     DOCUMENT ENGINE (SDE 1)  │          │   3-TIER AI ENGINE (SDE 2)   │
│ • OOXML AST Parser           │          │ • Tier 1: NVIDIA NIM         │
│ • In-Place Run Text Mutator  │◄────────►│   (Llama 3.2 90B/11B Vision) │
│ • Table Style & Cell Cloner  │          │ • Tier 2: OpenCode Zen       │
│ • Spatial EMU Diagram Inserter│         │   (MiMo-V2.5 / Muse Spark)   │
│ • Clean DOCX Packaging       │          │ • Tier 3: Google Gemini      │
└──────────────────────────────┘          │   (Gemini 2.5 Flash Fallback)│
                                          │ • Resilient JSON Auto-Healer │
                                          └──────────────────────────────┘
```

Detailed technical deep dives are documented in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 👥 Equal 2-SDE Team Split (50 / 50 Toughness)

The backend workload is divided equally between two Software Development Engineers:

| Dimension | **SDE 1 (Systems, OOXML & Data Lead)** | **SDE 2 (AI Gateway, Auth & Pipeline Lead)** |
| :--- | :--- | :--- |
| **Core Hard Problem** | **Low-Level OOXML In-Place Mutation**: Reverse-engineer WordprocessingML trees, replace `<w:t>` runs without touching styles `<w:rPr>`, clone table XML formatting, and embed photos using EMUs. | **Resilient 3-Tier AI Fallback**: Multimodal client with circuit breakers for NVIDIA NIM → OpenCode Zen → Gemini 2.5, plus automated JSON syntax healing. |
| **Security & Safety** | **File Sandbox & Anti-Zip-Bomb**: Magic-byte binary sniffing (`PK\x03\x04`), decompression-bomb detection ($>150\text{ MB}$ limit), path traversal sanitization, and ephemeral storage cleanup. | **Enterprise Auth & Gateway Defense**: Bcrypt salted password hashing, dual-token JWT rotation, sliding-window rate limiting (SlowAPI), and HTTP security headers. |
| **State & Flow** | **Database & Atomic Quotas**: SQLAlchemy async models (`User`, `Job`), row-level locks for atomic 50 docs/month quota deductions. | **Async Pipeline & Real-Time SSE**: Background worker orchestrator and Server-Sent Events (SSE) stream advancing the 5-step UI pipeline. |
| **Files Owned** | `document_engine.py`, `security_file.py`, `database.py`, `models.py` | `ai_fallback_engine.py`, `security_auth.py`, `middleware.py`, `main.py` |

---

## ⛓️ Sequential 10-Link Task Chain

Every link takes the exact output of the preceding link:

1. **Link 1 (Shared)**: Foundation Contract, Pydantic schemas (`schemas.py`), and `.env.example`.
2. **Link 2 (SDE 1)**: Database tables & atomic quota deduction functions (`database.py`, `models.py`).
3. **Link 3 (SDE 2)**: Bcrypt password hashing, JWT issue/verify, and Auth API (`security_auth.py`).
4. **Link 4 (SDE 2)**: API Rate Limiter (SlowAPI), security headers, and CORS perimeter (`middleware.py`).
5. **Link 5 (SDE 1)**: File security sandbox, magic-byte inspection, and anti-zip-bomb guard (`security_file.py`).
6. **Link 6 (SDE 1)**: OOXML DOM parser and structured document outline extractor (`document_engine.py`).
7. **Link 7 (SDE 2)**: 3-Tier multimodal AI failover engine with resilient JSON auto-healing (`ai_fallback_engine.py`).
8. **Link 8 (SDE 1)**: In-place run mutator, table styling cloner, and EMU diagram embedder (`document_engine.py`).
9. **Link 9 (SDE 2)**: Async job pipeline orchestrator and 5-stage real-time SSE streamer (`main.py`).
10. **Link 10 (Shared)**: React UI integration and end-to-end full-stack verification.

---

## 🚀 Quickstart Guide

### 1. Frontend Setup
```bash
cd Yokai-AI
npm install
npm run dev
```
The frontend starts on `http://localhost:5173` with Vite proxying `/api` requests to port `5000`.

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file from the template:
```env
# AI Provider Keys
NVIDIA_API_KEY=nvapi-your-key-here
NVIDIA_MODEL=meta/llama-3.2-90b-vision-instruct

OPENCODE_API_KEY=your-opencode-key-here
OPENCODE_MODEL=mimo-v2.5-free

GEMINI_API_KEY=your-gemini-key-here

# Security & Secrets
JWT_SECRET=generate-a-secure-random-secret-key-here
DATABASE_URL=sqlite:///./yokai.db
```

Start the FastAPI backend:
```bash
uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

---

## 📚 Documentation Reference

- **[Architecture Deep Dive](docs/ARCHITECTURE.md)**: OpenXML DOM reverse-engineering, EMU calculations, and multi-provider failover design.
- **[REST & SSE API Specification](docs/API.md)**: Request/response schemas, JWT authentication, and Server-Sent Events documentation.
- **[Production Sample Code](docs/SAMPLE_CODE.md)**: Reference code snippets for NVIDIA NIM, OpenCode, Gemini, OOXML run mutator, and security modules.

---

## ⚖️ License & Ownership

Copyright (c) 2026 **DrX-Team / Ashlin Mirsha**. All rights reserved.

This project is licensed under a **Source-Available Non-Commercial License**:
- **Permitted**: You may view, modify, study, and run the source code for personal, hobbyist, academic, and university research purposes.
- **Prohibited**: You may **NOT** use, sell, sublicense, deploy, or commercially monetize this software or hosted SaaS without a written commercial license.
- **Enterprise Licensing**: For enterprise deployment, white-labeling, or commercial authorization, contact:  
  **Email**: `ashlinmirsha@gmail.com` / `323911451+DrX-Team@users.noreply.github.com`
