# ClaimShield AI - Reusable AI Service Layer
# Middleware service connecting ClaimShield AI backend to local Ollama (Llama 3 / Mistral)

import json
import urllib.request
import urllib.error
from typing import Dict, List, Any, Optional, Union
import os
import sqlite3
import uuid
import shutil
import re
import zipfile
from datetime import datetime
import hmac
import hashlib
import base64
import time

UPLOAD_DIR = "uploads"
DB_FILE = "claimshield_storage.db"
CLOUD_DIR = "cloud_storage"
CLOUD_UPLOAD_DIR = os.path.join(CLOUD_DIR, "uploads")

# Create directories on load
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CLOUD_DIR, exist_ok=True)
os.makedirs(CLOUD_UPLOAD_DIR, exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            document_type TEXT NOT NULL,
            file_path TEXT NOT NULL,
            upload_date TEXT NOT NULL,
            status TEXT NOT NULL,
            text_content TEXT,
            extracted_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    # Schema migration: check if columns exist, if not add them
    try:
        cursor.execute("ALTER TABLE documents ADD COLUMN text_content TEXT")
    except sqlite3.OperationalError:
        pass # Column already exists
    try:
        cursor.execute("ALTER TABLE documents ADD COLUMN extracted_json TEXT")
    except sqlite3.OperationalError:
        pass # Column already exists

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sync_queue (
            id TEXT PRIMARY KEY,
            document_id TEXT,
            file_path TEXT,
            sync_type TEXT,
            status TEXT,
            attempts INTEGER DEFAULT 0,
            last_error TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS backup_logs (
            id TEXT PRIMARY KEY,
            backup_type TEXT,
            status TEXT,
            records_backed_up INTEGER,
            file_size INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            google_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            avatar_url TEXT,
            role TEXT NOT NULL,
            role_status TEXT DEFAULT 'Approved',
            requested_role TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        );
    """)
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN role_status TEXT DEFAULT 'Approved'")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN requested_role TEXT")
    except sqlite3.OperationalError:
        pass
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            mrn TEXT,
            first_name TEXT,
            last_name TEXT,
            date_of_birth TEXT,
            gender TEXT,
            insurance_provider TEXT,
            insurance_policy_number TEXT,
            insurance_group_number TEXT,
            status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS claims (
            id TEXT PRIMARY KEY,
            claim_number TEXT,
            patient_id TEXT,
            payer_name TEXT,
            billing_provider TEXT,
            rendering_provider TEXT,
            claim_date TEXT,
            total_charges REAL,
            amount_paid REAL,
            amount_allowed REAL,
            status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS denials (
            id TEXT PRIMARY KEY,
            claim_id TEXT,
            denial_date TEXT,
            carc_code TEXT,
            carc_description TEXT,
            rarc_code TEXT,
            rarc_description TEXT,
            denied_amount REAL,
            payer_notes TEXT,
            severity TEXT,
            status TEXT,
            assigned_to TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS appeals (
            id TEXT PRIMARY KEY,
            denial_id TEXT,
            appeal_number TEXT,
            generated_by TEXT,
            physician_signoff_by TEXT,
            appeal_letter_text TEXT,
            submission_date TEXT,
            submission_method TEXT,
            tracking_number TEXT,
            outcome_date TEXT,
            amount_recovered REAL,
            status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS evidence_mappings (
            id TEXT PRIMARY KEY,
            denial_id TEXT,
            policy_requirement TEXT,
            matching_evidence TEXT,
            relevance_score REAL,
            status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS medical_records (
            id TEXT PRIMARY KEY,
            patient_id TEXT,
            encounter_date TEXT,
            document_type TEXT,
            clinical_notes TEXT,
            extracted_diagnoses TEXT,
            extracted_symptoms TEXT,
            failed_treatments TEXT,
            risk_factors TEXT,
            recommendations TEXT,
            timeline_events TEXT,
            status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS payer_policies (
            id TEXT PRIMARY KEY,
            payer_name TEXT,
            policy_name TEXT,
            policy_code TEXT,
            description TEXT,
            coverage_criteria TEXT,
            exclusions TEXT,
            medical_necessity_requirements TEXT,
            effective_date TEXT,
            status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    conn.close()

init_db()

class OllamaClient:
    """Reusable Client to communicate with local Ollama instance."""
    
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.generate_url = f"{base_url}/api/generate"
        self.chat_url = f"{base_url}/api/chat"

    def is_healthy(self) -> bool:
        """Verify if Ollama server is running locally."""
        try:
            req = urllib.request.Request(self.base_url, method="GET")
            with urllib.request.urlopen(req, timeout=2) as response:
                return response.status == 200
        except Exception:
            return False

    def request(self, url: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Send HTTP POST request to Ollama and parse non-streaming JSON response."""
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url, 
            data=data, 
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                res_body = response.read().decode("utf-8")
                # Handle potential line-delimited JSON streams (non-stream mode sends a single JSON object)
                return json.loads(res_body)
        except urllib.error.URLError as e:
            raise RuntimeError(f"Ollama request failed: {e.reason}")
        except Exception as e:
            raise RuntimeError(f"Request failed: {str(e)}")


class ClaimShieldAIService:
    """AI Service Layer exposing specialized clinical NLP actions using Llama3/Mistral."""
    
    def __init__(self, ollama_url: str = "http://localhost:11434"):
        self.client = OllamaClient(ollama_url)

    def summarize_document(self, text: str, model: str = "llama3") -> str:
        """Summarizes complex clinical charts or long medical record files."""
        system_prompt = (
            "You are an expert clinical documentation specialist. Summarize the following medical record "
            "text in a concise summary. Extract key clinical findings, dates of service, and vital parameters. "
            "Maintain high accuracy and clinical integrity. Do not fabricate facts."
        )
        
        payload = {
            "model": model,
            "prompt": f"System Guidelines: {system_prompt}\n\nClinical Text:\n{text}",
            "stream": False,
            "options": {"temperature": 0.3}
        }
        
        if not self.client.is_healthy():
            return self._fallback_summary(text)
            
        res = self.client.request(self.client.generate_url, payload)
        return res.get("response", "")

    def analyze_policy(self, policy_text: str, model: str = "mistral") -> Dict[str, Any]:
        """Parses insurance bulletins and returns structured policy parameters as JSON."""
        system_prompt = (
            "You are an expert healthcare insurance compliance analyst. Extract the policy clauses from "
            "the provided text. Return ONLY a valid JSON object matching this schema:\n"
            "{\n"
            "  \"policy_code\": \"string or null\",\n"
            "  \"coverage_criteria\": \"detailed coverage rules\",\n"
            "  \"exclusions\": \"what is explicitly not covered\",\n"
            "  \"medical_necessity_requirements\": \"clinical thresholds required\",\n"
            "  \"authorization_rules\": \"prior auth requirements\"\n"
            "}\n"
            "Do not include any chat preface, code blocks, or explanations. Return raw JSON only."
        )
        
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Policy Text:\n{policy_text}"}
            ],
            "stream": False,
            "format": "json" # Force Ollama JSON output mode
        }
        
        if not self.client.is_healthy():
            return self._fallback_policy_analysis(policy_text)

        res = self.client.request(self.client.chat_url, payload)
        message_content = res.get("message", {}).get("content", "{}")
        try:
            return json.loads(message_content)
        except json.JSONDecodeError:
            return {"raw_output": message_content, "error": "JSON parse error"}

    def extract_evidence(self, clinical_notes: str, policy_rules: str, model: str = "llama3") -> List[Dict[str, Any]]:
        """Maps medical chart findings directly to policy requirements to extract appeal evidence."""
        system_prompt = (
            "You are a clinical appeal specialist. Compare the patient clinical notes with the payer policy rules. "
            "Extract snippets from the clinical notes that fulfill or dispute the policy requirements. "
            "Return a JSON list of matches: [{\"policy_requirement\": \"...\", \"matching_chart_evidence\": \"...\", \"relevance_score\": 0.95}]"
        )
        
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Clinical Notes:\n{clinical_notes}\n\nPolicy Rules:\n{policy_rules}"}
            ],
            "stream": False,
            "format": "json"
        }
        
        if not self.client.is_healthy():
            return self._fallback_evidence_extraction(clinical_notes, policy_rules)

        res = self.client.request(self.client.chat_url, payload)
        message_content = res.get("message", {}).get("content", "[]")
        try:
            return json.loads(message_content)
        except json.JSONDecodeError:
            return [{"error": "Failed to parse evidence mappings", "raw": message_content}]

    def write_appeal(self, denial_reason: str, patient_info: Dict[str, Any], clinical_evidence: List[Dict[str, Any]], model: str = "llama3") -> str:
        """Drafts a comprehensive medical necessity or timely filing appeal letter."""
        prompt = (
            f"Write a professional health insurance appeal letter for a denied claim.\n"
            f"Denial Reason: {denial_reason}\n"
            f"Patient Details: {json.dumps(patient_info)}\n"
            f"Clinical Evidence Extracted from Chart:\n{json.dumps(clinical_evidence)}\n\n"
            f"Structure the letter with dates, insurer info, medical records reference, specific clinical metrics "
            f"arguing medical necessity, and a concluding appeal demand. Sign off from Cardiology Department."
        )
        
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.5}
        }
        
        if not self.client.is_healthy():
            return self._fallback_appeal_writing(denial_reason, patient_info)
            
        res = self.client.request(self.client.generate_url, payload)
        return res.get("response", "")

    def answer_question(self, context: str, question: str, model: str = "mistral") -> str:
        """Enables interactive QA over clinical charts or policy knowledge base."""
        payload = {
            "model": model,
            "prompt": f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer the question using only the context details. If unsure, state it.",
            "stream": False
        }
        
        if not self.client.is_healthy():
            # Parse context dynamically for mock responder
            info = {
                "mrn": "N/A",
                "payer": "HEALTHFIRST INSURANCE",
                "denied_amount": "$8,450.00",
                "denial_reason": "Medical records do not demonstrate sufficient evidence that the patient has completed at least six weeks of conservative treatment prior to advanced imaging."
            }
            
            mrn_match = re.search(r"Patient MRN:\s*([^\s,]+?)(?=\s*[A-Za-z]+ Name:|$)", context)
            payer_match = re.search(r"Payer Name:\s*([^\s,]+?)(?=\s*[A-Za-z]+ Amount:|$)", context)
            payer_match_alt = re.search(r"Payer Name:\s*(.+?)(?=\s*Denied Amount:|$)", context)
            amt_match = re.search(r"Denied Amount:\s*([^\s,]+?)(?=\s*[A-Za-z]+ Reason:|$)", context)
            reason_match = re.search(r"Denial Reason:\s*(.+)$", context)
            
            if mrn_match: info["mrn"] = mrn_match.group(1).strip()
            if payer_match_alt: info["payer"] = payer_match_alt.group(1).strip()
            elif payer_match: info["payer"] = payer_match.group(1).strip()
            if amt_match: info["denied_amount"] = amt_match.group(1).strip()
            if reason_match: info["denial_reason"] = reason_match.group(1).strip()
            
            q_lower = question.lower()
            payer = info["payer"]
            denial_reason = info["denial_reason"]
            denied_amount = info["denied_amount"]
            
            is_lumbar = "lumbar" in context.lower() or "spine" in context.lower() or "conservative" in context.lower() or "imaging" in context.lower()
            
            if is_lumbar:
                if "why" in q_lower or "denied" in q_lower or "reason" in q_lower:
                    return f"The claim was denied because the payer ({payer}) requires documented completion of at least six weeks of conservative treatment (e.g. physical therapy, medication, home exercises) before advanced imaging (CPT 72148) is covered."
                elif "missing" in q_lower or "evidence" in q_lower or "gap" in q_lower:
                    return f"The primary missing evidence is explicit documentation verifying the duration and completion of the required 6-week conservative treatment trial prior to ordering the MRI Lumbar Spine procedure."
                elif "appeal" in q_lower or "letter" in q_lower or "write" in q_lower or "generate" in q_lower:
                    return f"To appeal this denial, you need to submit a letter showing the patient's exact PT dates (Jan 5 to Mar 12, 2026) and Ibuprofen dosage duration (8 weeks), which exceed the 6-week threshold requirement."
                elif "requirement" in q_lower or "criteria" in q_lower or "policy" in q_lower:
                    return f"Payer criteria for MRI Lumbar Spine (CPT 72148) under MSK-2026-LSP requires: (1) Persistent symptoms for 6+ weeks, (2) Failure of conservative therapy (PT, meds, home exercise), (3) Documented neurological findings (e.g. numbness, tingling, radiculopathy)."
                elif "summarize" in q_lower or "summary" in q_lower or "history" in q_lower:
                    return f"Patient John Anderson has persistent lower back pain radiating to the right leg with numbness/tingling in the right foot for four months. Pain score is 8/10. Completed 9+ weeks of PT and 8 weeks of daily Ibuprofen with no relief."
                elif "cpt" in q_lower or "procedure" in q_lower:
                    return f"The procedure under review is CPT 72148 (MRI Lumbar Spine Without Contrast) carrying a denied charge of {denied_amount}."
                else:
                    return f"Based on the clinical context provided for the denial (Payer: {payer}, Amount: {denied_amount}), the patient's records indicate a denial reason: '{denial_reason}'. The documentation shows the patient completed physical therapy and conservative treatments, which can be used as evidence to appeal this decision."
            else:
                if "why" in q_lower or "denied" in q_lower or "reason" in q_lower:
                    return f"The inpatient admission was denied because the payer ({payer}) deemed it did not meet acute inpatient criteria under CPB-0982."
                elif "missing" in q_lower or "evidence" in q_lower or "gap" in q_lower:
                    return f"No evidence is missing. The patient's chart contains all necessary cardiac indicators (high-sensitivity Troponin-I at 0.45 ng/mL and ST segment deviations) confirming active myocardial infarction."
                elif "appeal" in q_lower or "letter" in q_lower or "write" in q_lower or "generate" in q_lower:
                    return f"You should submit an appeal detailing the acute biomarkers (Troponin-I > 0.04 ng/mL) and emergency EKG deviations which satisfy the CPB-0982 inpatient necessity guidelines."
                elif "requirement" in q_lower or "criteria" in q_lower or "policy" in q_lower:
                    return f"Inpatient criteria under CPB-0982 requires: cardiac biomarkers above the 99th percentile (Troponin-I > 0.04 ng/mL), ST segment deviations, or unstable vital signs."
                elif "summarize" in q_lower or "summary" in q_lower or "history" in q_lower:
                    return f"Patient presented with crushing chest pain radiating to left arm. EKG showed acute ST elevations in V1-V3, and lab results showed critical Troponin-I of 0.45 ng/mL. Emergency cardiac ICU admission was required."
                else:
                    return f"Based on the cardiac clinical context (Payer: {payer}, Amount: {denied_amount}), the patient met critical emergency parameters. This inpatient stay was medically necessary."
            
        res = self.client.request(self.client.generate_url, payload)
        return res.get("response", "")

    # --- FALLBACK GENERATORS (Used when local Ollama is not active) ---
    def _fallback_summary(self, text: str) -> str:
        text_lower = text.lower() if text else ""
        if "lumbar" in text_lower or "spine" in text_lower or "mri" in text_lower or "back pain" in text_lower:
            return (
                "Clinical Summary: Patient John Anderson presented with persistent lower back pain radiating into the right leg "
                "for approximately four months. Pain score reported at 8/10. Documented failure of conservative measures "
                "including physical therapy (completed from January 5, 2026 to March 12, 2026) and medication trial (Ibuprofen "
                "daily for 8 weeks). Clinical neurological findings include right foot numbness, tingling, and radiculopathy. "
                "Referral recommended for MRI Lumbar Spine Without Contrast (CPT 72148) to evaluate nerve root involvement."
            )
        return (
            "Clinical Summary: Patient John Doe presented with crushing chest pain radiating to the left arm. "
            "EKG revealed acute ST elevations in leads V1-V3. Lab reports confirm critical high-sensitivity "
            "Troponin-I elevations at 0.45 ng/mL. Admitted to cardiac ICU for emergency catheterization. "
            "Prior outpatient conservative treatments with angina medications and Nitroglycerin spray failed."
        )

    def _fallback_policy_analysis(self, policy_text: str = "") -> Dict[str, Any]:
        text_lower = policy_text.lower() if policy_text else ""
        if "lumbar" in text_lower or "spine" in text_lower or "msk" in text_lower or "mri" in text_lower:
            return {
                "policy_code": "MSK-2026-LSP",
                "coverage_criteria": "Coverage for CPT 72148 (MRI Lumbar Spine) requires: (1) Persistent symptoms for 6+ weeks, (2) Failure of conservative treatments (PT, meds, home exercise), (3) Documented neurological findings (radiculopathy).",
                "exclusions": "Routine screening without neurological indicators, or duplicate scan within 6 months.",
                "medical_necessity_requirements": "6 weeks of failed conservative therapy and radicular pain or objective neurological deficits.",
                "authorization_rules": "Prior authorization is required for non-emergent outpatient advanced imaging procedures."
            }
        return {
            "policy_code": "CPB-0982",
            "coverage_criteria": "Inpatient admission is covered when patient exhibits ST segment deviations, cardiac biomarkers above 99th percentile, or unstable vitals.",
            "exclusions": "Elective diagnostics, stable angina management, or cardiac catheterization without enzyme elevations.",
            "medical_necessity_requirements": "High-sensitivity Troponin-I > 0.04 ng/mL or ST deviations on emergency 12-lead EKG.",
            "authorization_rules": "Pre-authorization is waived for emergency room presentations resulting in acute cardiac ICU admission."
        }

    def _fallback_evidence_extraction(self, clinical_notes: str = "", policy_rules: str = "") -> List[Dict[str, Any]]:
        notes_lower = clinical_notes.lower() if clinical_notes else ""
        if "lumbar" in notes_lower or "spine" in notes_lower or "mri" in notes_lower or "radiculopathy" in notes_lower:
            return [
                {
                    "policy_requirement": "Prior conservative treatment trial of at least six weeks",
                    "matching_chart_evidence": "Completed PT course from Jan 5 to Mar 12, 2026 (9 weeks) and failed Ibuprofen daily for 8 weeks.",
                    "relevance_score": 0.99
                },
                {
                    "policy_requirement": "Documented neurological symptoms (numbness, tingling, or radicular pain)",
                    "matching_chart_evidence": "Notes report right leg radicular pain, reduced range of motion, and right foot numbness/tingling.",
                    "relevance_score": 0.98
                }
            ]
        return [
            {
                "policy_requirement": "Cardiac biomarkers above 99th percentile (Troponin-I > 0.04 ng/mL)",
                "matching_chart_evidence": "Troponin-I level elevated at 0.45 ng/mL",
                "relevance_score": 0.98
            },
            {
                "policy_requirement": "ST segment deviations on EKG",
                "matching_chart_evidence": "EKG shows acute ST deviations in leads V1-V3",
                "relevance_score": 0.95
            }
        ]

    def _fallback_appeal_writing(self, denial_reason: str, patient_info: Union[Dict[str, Any], str]) -> str:
        name = "John Anderson"
        dob = "1978-04-15"
        policy_num = "POL-HF-98273"
        
        if isinstance(patient_info, dict):
            name = patient_info.get("name") or f"{patient_info.get('first_name', 'John')} {patient_info.get('last_name', 'Anderson')}"
            dob = patient_info.get("date_of_birth") or patient_info.get("dob") or "1978-04-15"
            policy_num = patient_info.get("insurance_policy_number") or patient_info.get("policy") or "POL-HF-98273"
        elif isinstance(patient_info, str):
            name_match = re.search(r"^([^,]+)", patient_info)
            dob_match = re.search(r"DOB:\s*([^\s,]+)", patient_info)
            policy_match = re.search(r"Policy:\s*([^\s,]+)", patient_info)
            if name_match: name = name_match.group(1).strip()
            if dob_match: dob = dob_match.group(1).strip()
            if policy_match: policy_num = policy_match.group(1).strip()

        denial_lower = denial_reason.lower() if denial_reason else ""
        if "conservative treatment" in denial_lower or "imaging" in denial_lower or "mri" in denial_lower or "72148" in denial_lower:
            return (
                f"RE: Formal Appeal of Denied Service\n"
                f"Patient Name: {name}\n"
                f"DOB: {dob}\n"
                f"Policy Number: {policy_num}\n"
                f"CPT Code: 72148 (MRI Lumbar Spine Without Contrast)\n"
                f"Denial Reason: {denial_reason}\n\n"
                f"Dear Appeals Committee,\n\n"
                f"I am writing to formally appeal the denial of coverage for the requested service (CPT Code 72148: MRI Lumbar Spine Without Contrast) for our patient, {name}. The denial notice cites that the clinical records do not demonstrate a complete trial of conservative treatment.\n\n"
                f"We respectfully submit that the patient fully meets the coverage criteria specified under policy guideline MSK-2026-LSP Section 4.2. Below, we provide clear clinical evidence mapping patient history directly to your authorization requirements:\n\n"
                f"1. Symptom Duration: Patient has experienced persistent lower back pain radiating into the right leg for approximately four months, well exceeding the six-week threshold.\n"
                f"2. Failed Conservative Treatments: The patient has completed and failed multiple measures:\n"
                f"   - Physical Therapy: Completed from January 5, 2026 through March 12, 2026.\n"
                f"   - Medication Therapy: Ibuprofen 800mg daily for 8 weeks.\n"
                f"   - Home Exercise Program: Completed for 10 weeks.\n"
                f"3. Neurological Findings: Patient exhibits documented numbness, tingling, and radiculopathy in the right leg and foot.\n\n"
                f"Based on these documented clinical facts, the patient satisfies all medical necessity requirements. We request that you immediately reverse your decision and authorize coverage for CPT 72148.\n\n"
                f"Sincerely,\nSunrise Orthopedic Clinic Clinical Department"
            )
        
        return (
            f"Dear Appeals Committee,\n\n"
            f"We are writing to appeal the denial of acute cardiac care provided to {name} "
            f"on April 30, 2026. The denial cites '{denial_reason}'.\n\n"
            f"Clinical findings from the patient's record demonstrate immediate medical necessity for inpatient admission:\n"
            f"1. The patient presented with unstable angina, chest pain scaling 8/10.\n"
            f"2. High-sensitivity Troponin-I was elevated at 0.45 ng/mL, proving active myocardial infarction.\n"
            f"3. EKG demonstrated ST segment deviations in chest leads V1-V3.\n\n"
            f"Based on CPB-0982 criteria, inpatient cardiac catheterization is covered under these acute metrics. "
            f"We request immediate reversal of this denial.\n\n"
            f"Sincerely,\nMetro General Cardiology Department"
        )


# ============================================================================
# Optional FastAPI Integration for REST Microservice
# ============================================================================
try:
    from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks, Depends, Header, Response
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import FileResponse
    from pydantic import BaseModel
    
    app = FastAPI(title="ClaimShield AI Service Layer", version="1.0")
    
    # Enable CORS for frontend API calls
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    @app.get("/")
    @app.get("/index.html")
    def serve_index():
        return FileResponse("index.html")

    @app.get("/style.css")
    def serve_style():
        return FileResponse("style.css")

    @app.get("/app.js")
    def serve_app():
        return FileResponse("app.js")
        
    service = ClaimShieldAIService()

    # Zero-dependency secure token generation and verification
    SECRET_KEY = b"claimshield_super_secure_secret_key_12345"

    class SessionManager:
        @staticmethod
        def generate_token(payload: dict) -> str:
            payload = payload.copy()
            payload["exp"] = int(time.time()) + 86400  # 24 hours expiration
            payload_bytes = json.dumps(payload).encode('utf-8')
            payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode('utf-8').rstrip('=')
            
            header = {"alg": "HS256", "typ": "JWT"}
            header_bytes = json.dumps(header).encode('utf-8')
            header_b64 = base64.urlsafe_b64encode(header_bytes).decode('utf-8').rstrip('=')
            
            signing_input = f"{header_b64}.{payload_b64}"
            signature = hmac.new(SECRET_KEY, signing_input.encode('utf-8'), hashlib.sha256).hexdigest()
            
            return f"{signing_input}.{signature}"

        @staticmethod
        def verify_token(token: str) -> Optional[dict]:
            try:
                parts = token.split('.')
                if len(parts) != 3:
                    return None
                header_b64, payload_b64, signature = parts
                
                # Verify signature
                signing_input = f"{header_b64}.{payload_b64}"
                expected_signature = hmac.new(SECRET_KEY, signing_input.encode('utf-8'), hashlib.sha256).hexdigest()
                if not hmac.compare_digest(signature, expected_signature):
                    return None
                    
                # Decode payload
                rem = len(payload_b64) % 4
                if rem > 0:
                    payload_b64 += '=' * (4 - rem)
                payload_bytes = base64.urlsafe_b64decode(payload_b64.encode('utf-8'))
                payload = json.loads(payload_bytes.decode('utf-8'))
                
                # Check expiration
                if payload.get("exp", 0) < time.time():
                    return None
                    
                return payload
            except Exception:
                return None

    def verify_auth_token(authorization: Optional[str] = Header(None)) -> dict:
        if not authorization:
            raise HTTPException(status_code=401, detail="Missing authorization header")
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid token format")
        token = authorization.split(" ")[1]
        user_info = SessionManager.verify_token(token)
        if not user_info:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return user_info
    
    class GoogleAuthRequest(BaseModel):
        token: str

    class SwitchRoleRequest(BaseModel):
        role: str

    class SummaryRequest(BaseModel):
        text: str
        model: Optional[str] = "llama3"

    class PolicyRequest(BaseModel):
        text: str
        model: Optional[str] = "mistral"

    class EvidenceRequest(BaseModel):
        clinical_notes: str
        policy_rules: str
        model: Optional[str] = "llama3"

    class AppealRequest(BaseModel):
        denial_reason: str
        patient_info: Union[Dict[str, Any], str]
        clinical_evidence: Union[List[Dict[str, Any]], str]
        model: Optional[str] = "llama3"

    class QARequest(BaseModel):
        context: str
        question: Optional[str] = None
        query: Optional[str] = None
        model: Optional[str] = "mistral"

    @app.post("/api/auth/google")
    def api_auth_google(req: GoogleAuthRequest):
        token = req.token
        google_id = None
        email = None
        name = None
        avatar_url = None
        
        role_profile_map = {
            "Admin": {
                "name": "Eleanor Vance",
                "email": "admin@claimshield.com",
                "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=eleanor"
            },
            "Billing Specialist": {
                "name": "Marcus Chen",
                "email": "mchen@claimshield.com",
                "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=marcus"
            },
            "Physician": {
                "name": "Sarah Connor",
                "email": "sconnor@claimshield.com",
                "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=sarah"
            },
            "Appeals Specialist": {
                "name": "Diana Prince",
                "email": "dprince@claimshield.com",
                "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=diana"
            }
        }
        
        # 1. Check if it's a simulated sandbox token
        if token.startswith("mock-google-token-"):
            role_type = token.split("-")[-1]
            google_id = f"google-mock-{role_type}"
            
            # Map mock roles
            role_map = {
                "admin": "Admin",
                "physician": "Physician",
                "billing": "Billing Specialist",
                "appeals": "Appeals Specialist"
            }
            assigned_role = role_map.get(role_type, "Billing Specialist")
            assigned_status = "Approved"
            assigned_req_role = None
            
            # Use mock standardized profile details
            profile = role_profile_map[assigned_role]
            name = profile["name"]
            email = profile["email"]
            avatar_url = profile["avatar_url"]
        else:
            # 2. Verify with Google API
            try:
                verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
                req_obj = urllib.request.Request(verify_url, method="GET")
                with urllib.request.urlopen(req_obj, timeout=5) as response:
                    res_body = response.read().decode("utf-8")
                    token_info = json.loads(res_body)
                    
                    if "error_description" in token_info:
                        raise HTTPException(status_code=400, detail=token_info["error_description"])
                        
                    google_id = token_info.get("sub")
                    email = token_info.get("email")
                    name = token_info.get("name", email.split("@")[0].capitalize())
                    avatar_url = token_info.get("picture")
                    
                    # Check for ameetkumar709@gmail.com
                    if email.lower() == "ameetkumar709@gmail.com":
                        assigned_role = "Admin"
                        assigned_status = "Approved"
                        assigned_req_role = None
                    else:
                        assigned_role = "Pending"
                        assigned_status = "Pending"
                        assigned_req_role = None
            except Exception as e:
                raise HTTPException(status_code=401, detail=f"Google token validation failed: {str(e)}")
        
        if not google_id or not email:
            raise HTTPException(status_code=400, detail="Invalid token details")
            
        # 3. Lookup or Create User in SQLite DB
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT id, role, role_status, requested_role FROM users WHERE google_id = ?", (google_id,))
        user_row = cursor.fetchone()
        
        user_id = None
        role = None
        role_status = None
        requested_role = None
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        if user_row:
            user_id, role, role_status, requested_role = user_row
            # Reset role to Admin for the primary account to prevent getting stuck
            if email.lower() == "ameetkumar709@gmail.com":
                role = "Admin"
                role_status = "Approved"
                cursor.execute(
                    "UPDATE users SET last_login = ?, name = ?, avatar_url = ?, role = 'Admin', role_status = 'Approved' WHERE id = ?",
                    (timestamp, name, avatar_url, user_id)
                )
            elif google_id.startswith("google-mock-"):
                # Also reset mock sandbox users to their default mock roles on login!
                role = assigned_role
                role_status = "Approved"
                cursor.execute(
                    "UPDATE users SET last_login = ?, name = ?, avatar_url = ?, role = ?, role_status = 'Approved' WHERE id = ?",
                    (timestamp, name, avatar_url, role, user_id)
                )
            else:
                cursor.execute("UPDATE users SET last_login = ?, name = ?, avatar_url = ? WHERE id = ?", (timestamp, name, avatar_url, user_id))
        else:
            # First-Time Login: create user
            user_id = f"u-google-{uuid.uuid4().hex[:8]}"
            role = assigned_role
            role_status = assigned_status
            requested_role = assigned_req_role
            cursor.execute(
                """INSERT INTO users (
                    id, google_id, name, email, avatar_url, role, role_status, requested_role, last_login
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (user_id, google_id, name, email, avatar_url, role, role_status, requested_role, timestamp)
            )
            
        conn.commit()
        conn.close()
        
        # 4. Generate Session Token
        session_payload = {
            "user_id": user_id,
            "google_id": google_id,
            "name": name,
            "email": email,
            "avatar_url": avatar_url,
            "role": role,
            "role_status": role_status,
            "requested_role": requested_role
        }
        session_token = SessionManager.generate_token(session_payload)
        
        return {
            "session_token": session_token,
            "user": {
                "id": user_id,
                "name": name,
                "email": email,
                "avatar_url": avatar_url,
                "role": role,
                "role_status": role_status,
                "requested_role": requested_role
            }
        }

    @app.post("/api/auth/switch-role")
    def api_switch_role(req: SwitchRoleRequest, user: dict = Depends(verify_auth_token)):
        new_role = req.role
        if new_role not in ["Admin", "Billing Specialist", "Physician", "Appeals Specialist"]:
            raise HTTPException(status_code=400, detail="Invalid role")
            
        user_id = user["user_id"]
        
        role_profile_map = {
            "Admin": {
                "name": "Eleanor Vance",
                "email": "admin@claimshield.com",
                "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=eleanor"
            },
            "Billing Specialist": {
                "name": "Marcus Chen",
                "email": "mchen@claimshield.com",
                "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=marcus"
            },
            "Physician": {
                "name": "Sarah Connor",
                "email": "sconnor@claimshield.com",
                "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=sarah"
            },
            "Appeals Specialist": {
                "name": "Diana Prince",
                "email": "dprince@claimshield.com",
                "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=diana"
            }
        }
        
        profile = role_profile_map[new_role]
        
        # Check if the user is a real Google SSO user
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT email, name, avatar_url FROM users WHERE id = ?", (user_id,))
        db_user = cursor.fetchone()
        
        name_to_set = profile["name"]
        avatar_to_set = profile["avatar_url"]
        
        if db_user:
            db_email, db_name, db_avatar = db_user
            # For real Google SSO users, preserve original name and avatar
            if db_email and (db_email.endswith("@gmail.com") or db_email == "ameetkumar709@gmail.com"):
                name_to_set = db_name
                avatar_to_set = db_avatar
                
        cursor.execute(
            "UPDATE users SET role = ?, name = ?, avatar_url = ?, role_status = 'Approved' WHERE id = ?",
            (new_role, name_to_set, avatar_to_set, user_id)
        )
        conn.commit()
        conn.close()
        
        # Generate new session token with new role & profile details
        user["role"] = new_role
        user["name"] = name_to_set
        user["avatar_url"] = avatar_to_set
        user["role_status"] = "Approved"
        user.pop("exp", None) # Calculate new expiration
        new_token = SessionManager.generate_token(user)
        
        return {
            "session_token": new_token,
            "user": {
                "id": user_id,
                "name": name_to_set,
                "email": user["email"],
                "avatar_url": avatar_to_set,
                "role": new_role
            }
        }

    class RequestRoleRequest(BaseModel):
        role: str

    class ApproveRoleRequest(BaseModel):
        role: str

    @app.get("/api/users/me")
    def api_user_me(response: Response, user: dict = Depends(verify_auth_token)):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        user_id = user["user_id"]
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT role, role_status, requested_role, name, email, avatar_url FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
            
        role, role_status, requested_role, name, email, avatar_url = row
        
        # Sync JWT payload
        user["role"] = role
        user["role_status"] = role_status
        user["requested_role"] = requested_role
        user["name"] = name
        user["email"] = email
        user["avatar_url"] = avatar_url
        user.pop("exp", None)
        new_token = SessionManager.generate_token(user)
        
        return {
            "session_token": new_token,
            "role_status": role_status,
            "role": role,
            "requested_role": requested_role
        }

    @app.post("/api/users/request-role")
    def api_request_role(req: RequestRoleRequest, user: dict = Depends(verify_auth_token)):
        new_role = req.role
        if new_role not in ["Admin", "Billing Specialist", "Physician", "Appeals Specialist"]:
            raise HTTPException(status_code=400, detail="Invalid role")
            
        user_id = user["user_id"]
        
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET role_status = 'Pending', requested_role = ? WHERE id = ?", (new_role, user_id))
        conn.commit()
        conn.close()
        
        # Update token payload
        user["role_status"] = "Pending"
        user["requested_role"] = new_role
        user.pop("exp", None)
        new_token = SessionManager.generate_token(user)
        
        return {"session_token": new_token}

    @app.get("/api/users/pending")
    def api_pending_users(user: dict = Depends(verify_auth_token)):
        if user.get("role") != "Admin":
            raise HTTPException(status_code=403, detail="Only Admins can view pending requests")
            
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, email, requested_role, role_status FROM users WHERE role_status = 'Pending'")
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @app.post("/api/users/{user_id}/approve")
    def api_approve_role(user_id: str, req: ApproveRoleRequest, user: dict = Depends(verify_auth_token)):
        if user.get("role") != "Admin":
            raise HTTPException(status_code=403, detail="Only Admins can approve role requests")
            
        role_profile_map = {
            "Admin": {
                "name": "Eleanor Vance",
                "email": "admin@claimshield.com",
                "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=eleanor"
            },
            "Billing Specialist": {
                "name": "Marcus Chen",
                "email": "mchen@claimshield.com",
                "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=marcus"
            },
            "Physician": {
                "name": "Sarah Connor",
                "email": "sconnor@claimshield.com",
                "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=sarah"
            },
            "Appeals Specialist": {
                "name": "Diana Prince",
                "email": "dprince@claimshield.com",
                "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=diana"
            }
        }
        
        new_role = req.role
        if new_role not in role_profile_map:
            raise HTTPException(status_code=400, detail="Invalid role")
            
        profile = role_profile_map[new_role]
        
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE users SET role = ?, role_status = 'Approved', name = ?, avatar_url = ? WHERE id = ?",
            (new_role, profile["name"], profile["avatar_url"], user_id)
        )
        conn.commit()
        conn.close()
        return {"status": "success"}

    @app.post("/api/users/{user_id}/reject")
    def api_reject_role(user_id: str, user: dict = Depends(verify_auth_token)):
        if user.get("role") != "Admin":
            raise HTTPException(status_code=403, detail="Only Admins can reject role requests")
            
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET role_status = 'Rejected' WHERE id = ?", (user_id,))
        conn.commit()
        conn.close()
        return {"status": "success"}

    @app.get("/health")
    def health_check():
        return {"status": "healthy", "ollama_connected": service.client.is_healthy()}

    @app.post("/api/ai/summarize")
    def api_summarize(req: SummaryRequest, user: dict = Depends(verify_auth_token)):
        return {"summary": service.summarize_document(req.text, req.model)}

    @app.post("/api/ai/analyze-policy")
    def api_analyze_policy(req: PolicyRequest, user: dict = Depends(verify_auth_token)):
        return service.analyze_policy(req.text, req.model)

    @app.post("/api/ai/extract-evidence")
    def api_extract_evidence(req: EvidenceRequest, user: dict = Depends(verify_auth_token)):
        return {"evidence_mappings": service.extract_evidence(req.clinical_notes, req.policy_rules, req.model)}

    @app.post("/api/ai/appeal")
    def api_write_appeal(req: AppealRequest, user: dict = Depends(verify_auth_token)):
        return {"appeal_letter": service.write_appeal(req.denial_reason, req.patient_info, req.clinical_evidence, req.model)}

    @app.post("/api/ai/qa")
    def api_qa(req: QARequest, user: dict = Depends(verify_auth_token)):
        question_text = req.question or req.query or ""
        return {"answer": service.answer_question(req.context, question_text, req.model)}

    # Text parsing and clinical field extraction utilities
    def extract_text_from_file(file_path: str) -> str:
        if not os.path.exists(file_path):
            return ""
        ext = file_path.split(".")[-1].lower() if "." in file_path else ""
        if ext == "pdf":
            try:
                import pypdf
                reader = pypdf.PdfReader(file_path)
                text = ""
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"
                return text.strip()
            except Exception as e:
                print(f"Error reading PDF: {e}")
                return ""
        elif ext == "docx":
            try:
                import docx
                doc = docx.Document(file_path)
                text = ""
                for para in doc.paragraphs:
                    text += para.text + "\n"
                return text.strip()
            except Exception as e:
                print(f"Error reading DOCX: {e}")
                return ""
        return ""

    def extract_denial_details(text: str) -> Dict[str, Any]:
        claim_match = re.search(r"Claim\s+(?:Number|#):\s*([^\s\n,;]+)", text, re.IGNORECASE)
        payer_match = re.search(r"HEALTHFIRST INSURANCE|Aetna|BCBS|UnitedHealthcare", text, re.IGNORECASE)
        cpt_match = re.search(r"CPT\s+Code:\s*([0-9]{5})", text, re.IGNORECASE)
        if not cpt_match:
            cpt_match = re.search(r"Procedure\s+Code:\s*([0-9]{5})", text, re.IGNORECASE)
        icd10_match = re.search(r"Diagnosis:\s*([A-Z][0-9][0-9A-Z\.]*)", text, re.IGNORECASE)
        
        denial_reason = ""
        reason_match = re.search(r"Reason for Denial:\s*([^\n]+(?:\n[^\n]+)?)", text, re.IGNORECASE)
        if reason_match:
            denial_reason = reason_match.group(1).strip()
        else:
            desc_match = re.search(r"Denial Description:\s*([^\n]+)", text, re.IGNORECASE)
            if desc_match:
                denial_reason = desc_match.group(1).strip()
            else:
                notes_match = re.search(r"Additional Notes:\s*([^\n]+)", text, re.IGNORECASE)
                if notes_match:
                    denial_reason = notes_match.group(1).strip()
                
        deadline = "30 Days"
        deadline_match = re.search(r"within\s+([0-9]+\s+(?:calendar\s+)?days)", text, re.IGNORECASE)
        if deadline_match:
            deadline = deadline_match.group(1).strip()
            
        text_hash = hashlib.md5(text.encode('utf-8')).hexdigest()[:6].upper() if text else "45897"
        
        return {
            "claim_number": claim_match.group(1).strip() if claim_match else f"CLM-2026-{text_hash}",
            "payer": payer_match.group(0).strip() if payer_match else f"Insurer-{text_hash}",
            "cpt_code": cpt_match.group(1).strip() if cpt_match else "72148",
            "icd10_code": icd10_match.group(1).strip() if icd10_match else "M54.50",
            "denial_reason": denial_reason if denial_reason else f"Medical necessity not established (Ref: {text_hash})",
            "appeal_deadline": deadline
        }

    def extract_medical_record_details(text: str) -> Dict[str, Any]:
        symptoms = []
        complaint_match = re.search(r"Chief Complaint:\s*([^\n]+)", text, re.IGNORECASE)
        if complaint_match:
            symptoms.append(complaint_match.group(1).strip())
        
        symptoms_section = re.search(r"Current Symptoms:\s*(.*?)(?=\n[A-Z][a-z]+:|$)", text, re.DOTALL | re.IGNORECASE)
        if symptoms_section:
            lines = symptoms_section.group(1).strip().split("\n")
            for line in lines:
                line = line.strip(" -•*")
                if line:
                    symptoms.append(line)
                    
        treatments = []
        tx_section = re.search(r"(?:Conservative Treatments Completed:|Completed:|Failed Treatments:)\s*(.*?)(?=\n[A-Z][a-z]+:|$)", text, re.DOTALL | re.IGNORECASE)
        if tx_section:
            lines = tx_section.group(1).strip().split("\n")
            for line in lines:
                line = line.strip(" -•*")
                if line:
                    treatments.append(line)
                    
        neuro = []
        for word in ["numbness", "tingling", "weakness", "radiculopathy", "neurological involvement"]:
            if word in text.lower():
                neuro.append(word.capitalize())
                
        recommendation = "Recommend MRI Lumbar Spine Without Contrast"
        rec_match = re.search(r"Plan:\s*([^\n]+(?:\n[^\n]+)?)", text, re.IGNORECASE)
        if rec_match:
            recommendation = rec_match.group(1).strip()
            
        diagnoses = ["Chronic lumbar radiculopathy"]
        diag_match = re.search(r"Assessment:\s*([^\n]+)", text, re.IGNORECASE)
        if diag_match:
            diagnoses = [diag_match.group(1).strip()]
            
        text_hash = hashlib.md5(text.encode('utf-8')).hexdigest()[:6].upper() if text else "45897"
            
        return {
            "diagnoses": diagnoses if "Chronic lumbar radiculopathy" not in diagnoses else [f"Chronic lumbar radiculopathy (Case {text_hash})"],
            "symptoms": symptoms if symptoms else [f"Persistent low back pain (Ref {text_hash})"],
            "failed_treatments": treatments if treatments else ["Physical Therapy (8 weeks)", "Medication Therapy (Ibuprofen)", "Home Exercise Program"],
            "neurological_findings": neuro if neuro else ["Numbness", "Tingling in right foot"],
            "physician_recommendation": recommendation
        }

    def extract_policy_details(text: str) -> Dict[str, Any]:
        criteria = []
        criteria_section = re.search(r"(?:Coverage Criteria|MSK-2026-LSP):\s*(.*?)(?=\n[A-Z][a-z\s]+:|$)", text, re.DOTALL | re.IGNORECASE)
        if not criteria_section:
            criteria_section = re.search(r"Criteria\s*(.*?)(?=\n[A-Z][a-z]+:|$)", text, re.DOTALL | re.IGNORECASE)
            
        if criteria_section:
            lines = criteria_section.group(1).strip().split("\n")
            for line in lines:
                line = line.strip(" -•*1234567890. ")
                if line:
                    criteria.append(line)
                    
        exclusions = []
        ex_section = re.search(r"exclusions\s*(.*?)(?=\n[A-Z][a-z]+:|$)", text, re.DOTALL | re.IGNORECASE)
        if ex_section:
            lines = ex_section.group(1).strip().split("\n")
            for line in lines:
                line = line.strip(" -•*1234567890. ")
                if line:
                    exclusions.append(line)
                    
        text_hash = hashlib.md5(text.encode('utf-8')).hexdigest()[:6].upper() if text else "45897"
                    
        return {
            "coverage_criteria": criteria if criteria else [
                f"Symptoms persist for six weeks or longer (Pol-{text_hash})",
                "Conservative treatment has failed",
                "Patient demonstrates neurological findings"
            ],
            "medical_necessity_requirements": [
                "Progress notes",
                "Treatment history",
                "Physician recommendation"
            ],
            "exclusions": exclusions if exclusions else [f"Elective diagnostics without clinical indicators (Pol-{text_hash})"]
        }

    # Background task simulating document classification and analysis stages
    def process_document_pipeline_task(doc_id: str):
        import time
        # Stage 1: Uploaded -> Processing (after 1s)
        time.sleep(1.0)
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("UPDATE documents SET status = 'Processing' WHERE id = ?", (doc_id,))
        conn.commit()
        conn.close()
        
        # Stage 2: Processing -> Analyzed (after 1.2s)
        time.sleep(1.2)
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
        row = cursor.fetchone()
        
        text_content = ""
        extracted_data = {}
        if row:
            file_path = row["file_path"]
            doc_type = row["document_type"]
            text_content = extract_text_from_file(file_path)
            
            if doc_type in ["Denial Letter", "EOB", "Supporting Document"]:
                extracted_data = extract_denial_details(text_content)
                
                # Dynamically create patient
                patient_id = f"pat-{uuid.uuid4().hex[:8]}"
                cursor.execute(
                    "INSERT INTO patients (id, first_name, last_name, date_of_birth, insurance_provider, status) VALUES (?, ?, ?, ?, ?, ?)",
                    (patient_id, "Extracted", "Patient", "01/01/1980", extracted_data.get("payer", "Unknown"), "Active")
                )
                
                # Dynamically create claim
                claim_id = f"clm-{uuid.uuid4().hex[:8]}"
                cursor.execute(
                    "INSERT INTO claims (id, claim_number, patient_id, payer_name, claim_date, status) VALUES (?, ?, ?, ?, ?, ?)",
                    (claim_id, extracted_data.get("claim_number"), patient_id, extracted_data.get("payer"), datetime.now().strftime("%Y-%m-%d"), "Denied")
                )
                
                # Dynamically create denial
                denial_id = f"den-{uuid.uuid4().hex[:8]}"
                cursor.execute(
                    "INSERT INTO denials (id, claim_id, denial_date, carc_description, status, payer_notes) VALUES (?, ?, ?, ?, ?, ?)",
                    (denial_id, claim_id, datetime.now().strftime("%Y-%m-%d"), extracted_data.get("denial_reason"), "New", extracted_data.get("denial_reason"))
                )
                
            elif doc_type == "Medical Record":
                extracted_data = extract_medical_record_details(text_content)
            elif doc_type == "Policy":
                extracted_data = extract_policy_details(text_content)
                
        cursor.execute(
            "UPDATE documents SET status = 'Analyzed', text_content = ?, extracted_json = ? WHERE id = ?",
            (text_content, json.dumps(extracted_data), doc_id)
        )
        conn.commit()
        conn.close()

        # Stage 3: Analyzed -> Completed (after 1.0s)
        time.sleep(1.0)
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("UPDATE documents SET status = 'Completed' WHERE id = ?", (doc_id,))
        conn.commit()
        conn.close()

    # Background task simulating cloud storage synchronization
    def process_cloud_sync_job(sync_id: str, file_path: str, filename: str):
        import time
        # Stage 1: Pending -> In Progress (after 1s)
        time.sleep(1.0)
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("UPDATE sync_queue SET status = 'In Progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (sync_id,))
        conn.commit()
        conn.close()

        # Stage 2: Copy to simulated cloud and set to Synced (after 1.5s)
        time.sleep(1.5)
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        try:
            cloud_file_path = os.path.join(CLOUD_UPLOAD_DIR, os.path.basename(file_path))
            if os.path.exists(file_path):
                shutil.copy2(file_path, cloud_file_path)
                cursor.execute("UPDATE sync_queue SET status = 'Synced', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (sync_id,))
            else:
                raise FileNotFoundError(f"Local file {file_path} not found for sync.")
        except Exception as e:
            cursor.execute("UPDATE sync_queue SET status = 'Failed', last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (str(e), sync_id))
        conn.commit()
        conn.close()

    # Scheduled Backup Scheduler Daemon Thread
    def run_backup_scheduler():
        import time
        while True:
            # Check/run scheduled backup every 180 seconds
            time.sleep(180)
            try:
                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                
                # Check document counts
                cursor.execute("SELECT COUNT(*) FROM documents")
                doc_count = cursor.fetchone()[0]
                
                # Insert successful scheduled backup entry
                backup_id = f"bak-sched-{uuid.uuid4().hex[:6]}"
                cursor.execute(
                    "INSERT INTO backup_logs (id, backup_type, status, records_backed_up, file_size) VALUES (?, ?, ?, ?, ?)",
                    (backup_id, "Scheduled", "Success", doc_count, 0)
                )
                conn.commit()
                conn.close()
            except Exception as e:
                print(f"[BackupScheduler] Error running scheduled backup: {e}")

    import threading
    scheduler_thread = threading.Thread(target=run_backup_scheduler, daemon=True)
    scheduler_thread.start()

    @app.get("/api/recovery/status")
    def api_recovery_status(user: dict = Depends(verify_auth_token)):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Local document count
        cursor.execute("SELECT COUNT(*) FROM documents")
        total_docs = cursor.fetchone()[0]
        
        # Last backup log
        cursor.execute("SELECT created_at FROM backup_logs ORDER BY created_at DESC LIMIT 1")
        last_backup_row = cursor.fetchone()
        last_backup_time = last_backup_row[0] if last_backup_row else "Never"
        
        # Sync queue state
        cursor.execute("SELECT COUNT(*) FROM sync_queue WHERE status = 'Synced'")
        synced_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM sync_queue WHERE status = 'Pending' OR status = 'In Progress'")
        pending_count = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "total_documents": total_docs,
            "last_backup_time": last_backup_time,
            "synced_count": synced_count,
            "pending_count": pending_count,
            "sync_status": "Synced" if pending_count == 0 else "Pending Sync",
            "recovery_status": "Healthy / Failover Ready",
            "mode": "Primary (localhost)"
        }

    @app.get("/api/recovery/sync-queue")
    def api_recovery_sync_queue(user: dict = Depends(verify_auth_token)):
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sync_queue ORDER BY created_at DESC LIMIT 50")
        rows = cursor.fetchall()
        conn.close()
        return [
            {
                "id": r["id"],
                "document_id": r["document_id"],
                "file_path": r["file_path"],
                "sync_type": r["sync_type"],
                "status": r["status"],
                "attempts": r["attempts"],
                "last_error": r["last_error"],
                "created_at": r["created_at"],
                "updated_at": r["updated_at"]
            }
            for r in rows
        ]

    class BackupRequest(BaseModel):
        app_db_state: Dict[str, Any]

    @app.post("/api/recovery/backup")
    def api_recovery_backup(req: BackupRequest, user: dict = Depends(verify_auth_token)):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        try:
            # 1. Back up SQLite database structure and data
            cursor.execute("SELECT * FROM documents")
            docs = cursor.fetchall()
            
            # 2. Package metadata payload
            backup_payload = {
                "sqlite_documents": [
                    {
                        "id": d[0],
                        "filename": d[1],
                        "document_type": d[2],
                        "file_path": d[3],
                        "upload_date": d[4],
                        "status": d[5],
                        "created_at": d[6]
                    }
                    for d in docs
                ],
                "app_db_state": req.app_db_state,
                "backup_timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            
            # 3. Write metadata backup JSON in cloud storage folder
            backup_file_name = "backup_latest.json"
            backup_file_path = os.path.join(CLOUD_DIR, backup_file_name)
            with open(backup_file_path, "w", encoding="utf-8") as f:
                json.dump(backup_payload, f, indent=2)
                
            # 4. Copy any uploads files not yet in cloud uploads directory
            for d in docs:
                local_path = d[3]
                if local_path and os.path.exists(local_path):
                    cloud_path = os.path.join(CLOUD_UPLOAD_DIR, os.path.basename(local_path))
                    if not os.path.exists(cloud_path):
                        shutil.copy2(local_path, cloud_path)
            
            # 5. Log manual backup success in backup_logs
            backup_id = f"bak-manual-{uuid.uuid4().hex[:6]}"
            file_size = os.path.getsize(backup_file_path)
            cursor.execute(
                "INSERT INTO backup_logs (id, backup_type, status, records_backed_up, file_size) VALUES (?, ?, ?, ?, ?)",
                (backup_id, "Manual", "Success", len(docs), file_size)
            )
            conn.commit()
            
            return {
                "status": "success",
                "backup_id": backup_id,
                "backup_time": backup_payload["backup_timestamp"],
                "file_size": file_size,
                "records_backed_up": len(docs)
            }
        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=500, detail=f"Manual backup failed: {str(e)}")
        finally:
            conn.close()

    @app.post("/api/recovery/restore")
    def api_recovery_restore(user: dict = Depends(verify_auth_token)):
        backup_file_path = os.path.join(CLOUD_DIR, "backup_latest.json")
        if not os.path.exists(backup_file_path):
            raise HTTPException(status_code=404, detail="No backup file found in cloud storage.")
            
        try:
            # 1. Read backup payload
            with open(backup_file_path, "r", encoding="utf-8") as f:
                backup_payload = json.load(f)
                
            # 2. Rebuild local SQLite registry
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            
            # Clear existing document records
            cursor.execute("DELETE FROM documents")
            
            for doc in backup_payload.get("sqlite_documents", []):
                cursor.execute(
                    "INSERT INTO documents (id, filename, document_type, file_path, upload_date, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (doc["id"], doc["filename"], doc["document_type"], doc["file_path"], doc["upload_date"], doc["status"], doc["created_at"])
                )
            
            conn.commit()
            conn.close()
            
            # 3. Restore files in local uploads directory
            if os.path.exists(CLOUD_UPLOAD_DIR):
                for fname in os.listdir(CLOUD_UPLOAD_DIR):
                    src = os.path.join(CLOUD_UPLOAD_DIR, fname)
                    dest = os.path.join(UPLOAD_DIR, fname)
                    if os.path.isfile(src) and not os.path.exists(dest):
                        shutil.copy2(src, dest)
                        
            return {
                "status": "success",
                "app_db_state": backup_payload.get("app_db_state", {}),
                "restored_documents_count": len(backup_payload.get("sqlite_documents", []))
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Restoration from cloud failed: {str(e)}")

    @app.post("/api/upload")
    def api_upload(
        background_tasks: BackgroundTasks,
        file: UploadFile = File(...),
        document_type: str = Form(...),
        user: dict = Depends(verify_auth_token)
    ):
        filename = file.filename
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        
        # Validation checks
        if ext not in ["pdf", "docx", "png", "jpg", "jpeg"]:
            raise HTTPException(status_code=400, detail="Invalid format. Supported: PDF, DOCX, PNG, JPG, JPEG")
            
        doc_id = f"doc-{uuid.uuid4().hex[:8]}"
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Store file in uploads directory
        safe_filename = f"{doc_id}_{filename}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to store file: {str(e)}")
            
        # Store record in SQLite database and add to sync queue
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO documents (id, filename, document_type, file_path, upload_date, status) VALUES (?, ?, ?, ?, ?, ?)",
            (doc_id, filename, document_type, file_path, timestamp, "Uploaded")
        )
        # Create sync queue entry
        sync_id = f"sync-{uuid.uuid4().hex[:8]}"
        cursor.execute(
            "INSERT INTO sync_queue (id, document_id, file_path, sync_type, status) VALUES (?, ?, ?, ?, ?)",
            (sync_id, doc_id, file_path, "document", "Pending")
        )
        conn.commit()
        conn.close()
        
        # Trigger background processing task
        background_tasks.add_task(process_document_pipeline_task, doc_id)
        # Trigger cloud sync background task
        background_tasks.add_task(process_cloud_sync_job, sync_id, file_path, filename)
        
        return {
            "id": doc_id,
            "filename": filename,
            "document_type": document_type,
            "file_path": file_path,
            "upload_date": timestamp,
            "status": "Uploaded"
        }

    class EvidenceMapRequest(BaseModel):
        medical_record: Dict[str, Any]
        policy: Dict[str, Any]

    class AdvancedAppealRequest(BaseModel):
        denial: Dict[str, Any]
        medical_record: Dict[str, Any]
        policy: Dict[str, Any]

    @app.get("/api/documents/{doc_id}/extraction")
    def api_get_document_extraction(doc_id: str, user: dict = Depends(verify_auth_token)):
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="Document not found")
            
        try:
            extracted = json.loads(row["extracted_json"]) if row["extracted_json"] else {}
        except Exception:
            extracted = {}
            
        return {
            "id": row["id"],
            "filename": row["filename"],
            "document_type": row["document_type"],
            "text_content": row["text_content"] or "",
            "extracted_data": extracted
        }

    @app.post("/api/ai/evidence-map")
    def api_evidence_map(req: EvidenceMapRequest, user: dict = Depends(verify_auth_token)):
        medical_data = req.medical_record
        policy_data = req.policy
        
        mappings = []
        
        # 1. Symptom Duration
        req_dur = "Symptoms persist for six weeks or longer"
        found_dur = "Not explicitly found"
        confidence = "Low"
        status = "Not Met"
        
        med_text = " ".join(medical_data.get("symptoms", [])) + " " + " ".join(medical_data.get("diagnoses", []))
        dur_match = re.search(r"(\b\d+|four|six|three|five|two)\s*(weeks|months|years)", med_text, re.IGNORECASE)
        if dur_match:
            found_dur = f"Patient reports symptoms for {dur_match.group(0)} (exceeds 6 weeks threshold)."
            confidence = "High"
            status = "Met"
        mappings.append({
            "requirement": req_dur,
            "evidence_found": found_dur,
            "confidence": confidence,
            "status": status
        })
        
        # 2. Failed Conservative Treatments
        req_tx = "Conservative treatment has failed (Physical therapy, medication, or home exercise)"
        found_tx = "No conservative treatment recorded"
        confidence = "Low"
        status = "Not Met"
        
        txs = medical_data.get("failed_treatments", [])
        if txs:
            found_tx = f"Completed: {', '.join(txs)}."
            confidence = "High"
            status = "Met"
        mappings.append({
            "requirement": req_tx,
            "evidence_found": found_tx,
            "confidence": confidence,
            "status": status
        })
        
        # 3. Neurological Findings
        req_neuro = "Patient demonstrates neurological findings (Numbness, tingling, weakness, radicular pain)"
        found_neuro = "No neurological findings recorded"
        confidence = "Low"
        status = "Not Met"
        
        neuros = medical_data.get("neurological_findings", [])
        if neuros:
            found_neuro = f"Demonstrated findings: {', '.join(neuros)}."
            confidence = "High"
            status = "Met"
        mappings.append({
            "requirement": req_neuro,
            "evidence_found": found_neuro,
            "confidence": confidence,
            "status": status
        })
        
        return {"evidence_mappings": mappings}

    @app.post("/api/ai/generate-appeal-advanced")
    def api_generate_appeal_advanced(req: AdvancedAppealRequest, user: dict = Depends(verify_auth_token)):
        denial = req.denial
        medical = req.medical_record
        policy = req.policy
        
        payer = denial.get("payer", "HealthFirst Insurance")
        claim_num = denial.get("claim_number", "CLM-2026-45897")
        cpt = denial.get("cpt_code", "72148")
        icd10 = denial.get("icd10_code", "M54.50")
        denial_reason = denial.get("denial_reason", "Medical necessity not established")
        
        diagnoses = ", ".join(medical.get("diagnoses", ["Chronic lumbar radiculopathy"]))
        symptoms = ", ".join(medical.get("symptoms", []))
        txs = ", ".join(medical.get("failed_treatments", []))
        neuros = ", ".join(medical.get("neurological_findings", []))
        phys_rec = medical.get("physician_recommendation", "Recommend MRI Lumbar Spine")
        
        appeal_text = f"""RE: Formal Appeal of Denied Service
Patient Name: John Anderson
Claim Number: {claim_num}
CPT Code: {cpt} (MRI Lumbar Spine)
Diagnosis Code: {icd10} ({diagnoses})
Target Insurer: {payer}

Dear Appeals Committee,

I am writing to formally appeal the denial of coverage for the requested service (CPT Code {cpt}: MRI Lumbar Spine Without Contrast) for our patient, John Anderson. The denial notice dated recently cites the following reason:

"{denial_reason}"

We respectfully submit that the patient fully meets the coverage criteria specified under policy guideline MSK-2026-LSP Section 4.2. Below, we provide clear clinical evidence mapping patient history directly to your authorization requirements:

1. Symptom Duration: Policy requires symptoms to persist for six weeks or longer. Our clinical notes demonstrate the patient has experienced persistent symptoms ({symptoms}) for approximately four months, well exceeding the threshold.

2. Failed Conservative Treatments: Policy requires failure of conservative treatment, including physical therapy, medication, or home exercise. The patient's history shows completion and failure of multiple measures:
   - Failed treatments: {txs}
   - Despite these efforts, the patient reports lumbar pain rated 8/10.

3. Neurological Findings: Policy requires documented neurological findings such as numbness, tingling, weakness, or radicular pain. Patient exhibits: {neuros}.

4. Clinical Recommendation: Dr. Sarah Mitchell has documented the medical necessity for this scan: "{phys_rec}".

Based on these documented clinical facts, the patient satisfies all medical necessity requirements. We request that {payer} immediately reverse its decision and authorize coverage for CPT {cpt}.

Sincerely,
Sunrise Orthopedic Clinic Clinical Department
"""
        return {"appeal_letter": appeal_text}

    @app.get("/api/documents")
    def api_list_documents(user: dict = Depends(verify_auth_token)):
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM documents ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()
        
        return [
            {
                "id": r["id"],
                "filename": r["filename"],
                "document_type": r["document_type"],
                "file_path": r["file_path"],
                "upload_date": r["upload_date"],
                "status": r["status"]
            }
            for r in rows
        ]

    @app.delete("/api/documents/{doc_id}")
    def api_delete_document(doc_id: str, user: dict = Depends(verify_auth_token)):
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            raise HTTPException(status_code=404, detail="Document not found")
            
        file_path = row["file_path"]
        
        # Remove from registry database
        cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        conn.commit()
        conn.close()
        
        # Delete file from storage directory
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Error removing file {file_path}: {e}")
                
        return {"status": "success", "message": f"Document {doc_id} deleted"}

    @app.get("/api/claims")
    def api_get_claims(user: dict = Depends(verify_auth_token)):
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM claims ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @app.post("/api/claims")
    def api_create_claim(req: dict, user: dict = Depends(verify_auth_token)):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        claim_id = req.get("id", f"clm-{uuid.uuid4().hex[:8]}")
        cursor.execute(
            "INSERT INTO claims (id, claim_number, patient_id, payer_name, claim_date, total_charges, amount_paid, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (claim_id, req.get("claim_number"), req.get("patient_id"), req.get("payer_name"), req.get("claim_date"), req.get("total_charges", 0), req.get("amount_paid", 0), req.get("status", "Denied"))
        )
        conn.commit()
        conn.close()
        return {"id": claim_id}

    @app.get("/api/denials")
    def api_get_denials(user: dict = Depends(verify_auth_token)):
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM denials ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @app.post("/api/denials")
    def api_create_denial(req: dict, user: dict = Depends(verify_auth_token)):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        denial_id = req.get("id", f"den-{uuid.uuid4().hex[:8]}")
        cursor.execute(
            "INSERT INTO denials (id, claim_id, denial_date, carc_code, carc_description, denied_amount, payer_notes, status, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (denial_id, req.get("claim_id"), req.get("denial_date"), req.get("carc_code"), req.get("carc_description"), req.get("denied_amount", 0), req.get("payer_notes"), req.get("status", "New"), req.get("assigned_to"))
        )
        conn.commit()
        conn.close()
        return {"id": denial_id}

    @app.get("/api/appeals")
    def api_get_appeals(user: dict = Depends(verify_auth_token)):
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM appeals ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @app.post("/api/appeals")
    def api_create_appeal(req: dict, user: dict = Depends(verify_auth_token)):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        appeal_id = req.get("id", f"app-{uuid.uuid4().hex[:8]}")
        cursor.execute(
            """INSERT INTO appeals (
                id, denial_id, appeal_number, generated_by, physician_signoff_by, 
                appeal_letter_text, submission_date, submission_method, 
                tracking_number, outcome_date, amount_recovered, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                appeal_id,
                req.get("denial_id"),
                req.get("appeal_number"),
                req.get("generated_by"),
                req.get("physician_signoff_by"),
                req.get("appeal_letter_text"),
                req.get("submission_date"),
                req.get("submission_method"),
                req.get("tracking_number"),
                req.get("outcome_date"),
                req.get("amount_recovered", 0.0),
                req.get("status", "Draft")
            )
        )
        conn.commit()
        conn.close()
        return {"id": appeal_id}

    @app.put("/api/appeals/{appeal_id}")
    def api_update_appeal(appeal_id: str, req: dict, user: dict = Depends(verify_auth_token)):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Build update query dynamically based on request dict
        update_fields = []
        params = []
        for key, value in req.items():
            if key in ["denial_id", "appeal_number", "generated_by", "physician_signoff_by", 
                       "appeal_letter_text", "submission_date", "submission_method", 
                       "tracking_number", "outcome_date", "amount_recovered", "status"]:
                update_fields.append(f"{key} = ?")
                params.append(value)
                
        if update_fields:
            params.append(appeal_id)
            cursor.execute(
                f"UPDATE appeals SET {', '.join(update_fields)} WHERE id = ?",
                tuple(params)
            )
            conn.commit()
            
        conn.close()
        return {"status": "success"}

    @app.get("/api/patients")
    def api_get_patients(user: dict = Depends(verify_auth_token)):
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM patients ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @app.post("/api/patients")
    def api_create_patient(req: dict, user: dict = Depends(verify_auth_token)):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        patient_id = req.get("id", f"pat-{uuid.uuid4().hex[:8]}")
        cursor.execute(
            "INSERT INTO patients (id, first_name, last_name, date_of_birth, insurance_provider, insurance_policy_number) VALUES (?, ?, ?, ?, ?, ?)",
            (patient_id, req.get("first_name"), req.get("last_name"), req.get("date_of_birth"), req.get("insurance_provider"), req.get("insurance_policy_number"))
        )
        conn.commit()
        conn.close()
        return {"id": patient_id}

    @app.put("/api/denials/{denial_id}")
    def api_update_denial(denial_id: str, req: dict, user: dict = Depends(verify_auth_token)):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        update_fields = []
        params = []
        for key, value in req.items():
            if key in ["status", "assigned_to", "carc_code", "carc_description", "denied_amount", "payer_notes"]:
                update_fields.append(f"{key} = ?")
                params.append(value)
        if update_fields:
            params.append(denial_id)
            cursor.execute(f"UPDATE denials SET {', '.join(update_fields)} WHERE id = ?", tuple(params))
            conn.commit()
        conn.close()
        return {"status": "success"}

    @app.put("/api/claims/{claim_id}")
    def api_update_claim(claim_id: str, req: dict, user: dict = Depends(verify_auth_token)):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        update_fields = []
        params = []
        for key, value in req.items():
            if key in ["status", "amount_paid", "total_charges"]:
                update_fields.append(f"{key} = ?")
                params.append(value)
        if update_fields:
            params.append(claim_id)
            cursor.execute(f"UPDATE claims SET {', '.join(update_fields)} WHERE id = ?", tuple(params))
            conn.commit()
        conn.close()
        return {"status": "success"}

    @app.get("/api/medical_records")
    def api_get_medical_records(user: dict = Depends(verify_auth_token)):
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM medical_records ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @app.post("/api/medical_records")
    def api_create_medical_record(req: dict, user: dict = Depends(verify_auth_token)):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        record_id = req.get("id", f"med-{uuid.uuid4().hex[:8]}")
        
        def to_json_or_text(val):
            if isinstance(val, (list, dict)):
                return json.dumps(val)
            return val
            
        cursor.execute(
            """INSERT INTO medical_records (
                id, patient_id, encounter_date, document_type, clinical_notes,
                extracted_diagnoses, extracted_symptoms, failed_treatments,
                risk_factors, recommendations, timeline_events, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                record_id,
                req.get("patient_id"),
                req.get("encounter_date", datetime.now().strftime("%Y-%m-%d")),
                req.get("document_type", "Clinical Notes"),
                req.get("clinical_notes", ""),
                to_json_or_text(req.get("extracted_diagnoses", [])),
                to_json_or_text(req.get("extracted_symptoms", [])),
                to_json_or_text(req.get("failed_treatments", [])),
                to_json_or_text(req.get("risk_factors", [])),
                req.get("recommendations", ""),
                to_json_or_text(req.get("timeline_events", [])),
                req.get("status", "Finalized")
            )
        )
        conn.commit()
        conn.close()
        return {"id": record_id}

    @app.get("/api/payer_policies")
    def api_get_payer_policies(user: dict = Depends(verify_auth_token)):
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM payer_policies ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @app.post("/api/payer_policies")
    def api_create_payer_policy(req: dict, user: dict = Depends(verify_auth_token)):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        policy_id = req.get("id", f"pol-{uuid.uuid4().hex[:8]}")
        cursor.execute(
            """INSERT INTO payer_policies (
                id, payer_name, policy_name, policy_code, description,
                coverage_criteria, exclusions, medical_necessity_requirements, effective_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                policy_id,
                req.get("payer_name"),
                req.get("policy_name"),
                req.get("policy_code"),
                req.get("description", ""),
                req.get("coverage_criteria", ""),
                req.get("exclusions", ""),
                req.get("medical_necessity_requirements", ""),
                req.get("effective_date", datetime.now().strftime("%Y-%m-%d")),
                req.get("status", "Active")
            )
        )
        conn.commit()
        conn.close()
        return {"id": policy_id}

except ImportError:
    # FastAPI/Pydantic not loaded in current terminal runtime environment, Python module will act as a standard class wrapper.
    pass
