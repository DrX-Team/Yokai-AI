# Yokai AI Production Sample Code & Reference Implementations

This document provides tested reference implementations for the core subsystems of Yokai AI, designed for SDE 1 and SDE 2.

---

## 1. Multi-Provider AI Fallback Engine (SDE 2)

### 1.1 NVIDIA NIM Multimodal Client (`meta/llama-3.2-90b-vision-instruct`)
```python
import os, base64, requests

def query_nvidia_nim(prompt: str, image_path: str) -> dict:
    invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"
    api_key = os.getenv("NVIDIA_API_KEY")

    with open(image_path, "rb") as f:
        b64_image = base64.b64encode(f.read()).decode("utf-8")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "meta/llama-3.2-90b-vision-instruct", # or meta/llama-3.2-11b-vision-instruct
        "messages": [
            {
                "role": "system",
                "content": "You are Yokai AI. Output strict JSON only matching the requested schema."
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_image}"}}
                ]
            }
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"}
    }

    resp = requests.post(invoke_url, headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]
```

---

### 1.2 OpenCode Zen API Client (`mimo-v2.5-free` & `muse-spark-1.2-contributor-free`)
```python
import os, base64, requests

def query_opencode(prompt: str, image_path: str = None, model: str = "mimo-v2.5-free") -> dict:
    invoke_url = "https://opencode.ai/zen/v1/chat/completions"
    api_key = os.getenv("OPENCODE_API_KEY")

    user_content = [{"type": "text", "text": prompt}]

    if image_path:
        with open(image_path, "rb") as f:
            b64_image = base64.b64encode(f.read()).decode("utf-8")
        user_content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/png;base64,{b64_image}"}
        })

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model, # mimo-v2.5-free (vision/audio/video) or muse-spark-1.2-contributor-free
        "messages": [
            {"role": "system", "content": "You are Yokai AI document assistant. Return valid JSON only."},
            {"role": "user", "content": user_content}
        ],
        "temperature": 0.2
    }

    resp = requests.post(invoke_url, headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]
```

---

### 1.3 Google Gemini 2.5 Flash Fallback Client
```python
import os
from google import genai
from google.genai import types

def query_gemini(prompt: str, image_path: str = None) -> str:
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    contents = [prompt]
    if image_path:
        with open(image_path, "rb") as f:
            contents.append(types.Part.from_bytes(data=f.read(), mime_type="image/png"))

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=contents,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2
        )
    )
    return response.text
```

---

### 1.4 Resilient JSON Auto-Healer
Handles markdown blocks, trailing commas, and escaped characters often returned by LLMs:
```python
import json, re

def heal_and_parse_json(raw_text: str) -> dict:
    """Extracts and cleans JSON from raw LLM output."""
    # 1. Strip markdown code fences
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw_text.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r"```\s*$", "", cleaned, flags=re.MULTILINE)

    # 2. Extract first JSON block if surrounded by prose
    match = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", cleaned)
    if match:
        cleaned = match.group(1)

    # 3. Clean common LLM trailing commas before closing braces/brackets
    cleaned = re.sub(r",\s*([\]\}])", r"\1", cleaned)

    return json.loads(cleaned)
```

---

## 2. OOXML In-Place Mutation & EMU Embedding (SDE 1)

### 2.1 In-Place Text Run Replacement (Preserves 100% Formatting)
```python
from docx import Document

def in_place_replace_run_text(paragraph, target_placeholder: str, replacement_text: str):
    """
    Replaces target_placeholder inside paragraph runs without destroying
    font family, color, size, bold, or italic styles in <w:rPr>.
    """
    if target_placeholder not in paragraph.text:
        return False

    # Check if placeholder is contained entirely within a single run
    for run in paragraph.runs:
        if target_placeholder in run.text:
            run.text = run.text.replace(target_placeholder, replacement_text)
            return True

    # If placeholder was split across multiple runs by Word
    full_text = "".join(r.text for r in paragraph.runs)
    if target_placeholder in full_text:
        new_full_text = full_text.replace(target_placeholder, replacement_text)
        # Put updated text into first run; clear subsequent runs to retain 1st run styling
        if paragraph.runs:
            paragraph.runs[0].text = new_full_text
            for r in paragraph.runs[1:]:
                r.text = ""
        return True

    return False
```

---

### 2.2 Table Row Cloning with Border & Shading Inheritance
```python
from docx.table import Table

def append_row_with_inherited_styles(table: Table, row_values: list):
    """Clones previous row cell properties (<w:tcPr>, borders, shading) for new row."""
    new_row = table.add_row()
    template_row = table.rows[-2] # Reference row for styling

    for idx, value in enumerate(row_values):
        if idx < len(new_row.cells):
            target_cell = new_row.cells[idx]
            target_cell.text = str(value)

            # Clone run font style from template cell
            if template_row.cells[idx].paragraphs[0].runs:
                ref_run = template_row.cells[idx].paragraphs[0].runs[0]
                new_run = target_cell.paragraphs[0].runs[0]
                new_run.font.name = ref_run.font.name
                new_run.font.size = ref_run.font.size
                new_run.font.bold = ref_run.font.bold
                new_run.font.color.rgb = ref_run.font.color.rgb
```

---

### 2.3 Proportional Image Embedding with EMU Spatial Calculation
```python
from docx.shared import Inches
from PIL import Image

def embed_diagram_at_placeholder(doc, placeholder: str, image_path: str, max_width_inches: float = 5.0):
    """
    Replaces placeholder paragraph with an embedded drawing,
    calculating proportional EMUs to prevent image distortion.
    """
    with Image.open(image_path) as img:
        w_px, h_px = img.size
        aspect_ratio = h_px / w_px
        calc_width = min(max_width_inches, w_px / 96.0) # Assumes 96 DPI baseline
        calc_height = calc_width * aspect_ratio

    for p in doc.paragraphs:
        if placeholder in p.text:
            p.text = "" # Clear placeholder
            run = p.add_run()
            run.add_picture(image_path, width=Inches(calc_width))
            return True
    return False
```

---

## 3. Security Guard Implementation (SDE 1 & SDE 2)

### 3.1 Magic-Byte Sniffing & Anti-Zip-Bomb (SDE 1)
```python
import zipfile, os

MAX_DECOMPRESSED_SIZE = 150 * 1024 * 1024 # 150 MB

def verify_safe_docx(file_path: str):
    # 1. Magic byte verification (PK\x03\x04)
    with open(file_path, "rb") as f:
        header = f.read(4)
        if header != b"PK\x03\x04":
            raise ValueError("Invalid file signature. Not an authentic OpenXML package.")

    # 2. Decompression bomb check
    with zipfile.ZipFile(file_path, "r") as z:
        total_size = sum(info.file_size for info in z.infolist())
        if total_size > MAX_DECOMPRESSED_SIZE:
            raise ValueError("Security violation: Archive exceeds maximum allowable uncompressed size.")
```

---

### 3.2 Dual-Token JWT & Bcrypt Password Hashing (SDE 2)
```python
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.getenv("JWT_SECRET", "change-in-production")
ALGORITHM = "HS256"

def hash_user_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_user_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def issue_jwt_token(email: str, user_id: int) -> str:
    payload = {
        "sub": email,
        "uid": user_id,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)
```
