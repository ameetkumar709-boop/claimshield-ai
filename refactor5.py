import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_workflow = '''async function triggerDownstreamWorkflow(doc) {
    try {
        const response = await fetch("http://localhost:8000/api/documents/" + doc.id + "/extraction");
        if (!response.ok) throw new Error("Failed to fetch extraction");
        const extractedJson = await response.json();
        const extracted = extractedJson.extracted_data || {};
        
        if (doc.document_type === 'Denial Letter' || doc.document_type === 'EOB' || doc.document_type === 'Supporting Document') {
            const data = {
                fileName: doc.filename,
                metadata: {
                    claim_number: extracted.claim_number || "Unknown",
                    payer: extracted.payer_name || extracted.payer || "Unknown",
                    patient: extracted.patient_name || "Unknown",
                    cpt_code: extracted.cpt_code || "",
                    icd10_code: extracted.icd10_code || "",
                    denial_reason: extracted.denial_reason || "",
                    appeal_deadline: extracted.appeal_deadline || ""
                }
            };
            populateExtractedData(data);
            navigateTo('denial-intake');
            AppState.logAudit("AUTO_INGEST_TRIGGERED", "denials", doc.id, null, { source: doc.filename });
        }
        else if (doc.document_type === 'Medical Record') {
            document.getElementById('clin-extracted-diagnoses').value = (extracted.diagnoses || []).join(', ');
            document.getElementById('clin-extracted-symptoms').value = (extracted.symptoms || []).join(', ');
            document.getElementById('clin-failed-treatments').value = (extracted.failed_treatments || []).join(', ');
            document.getElementById('clin-risk-factors').value = (extracted.risk_factors || []).join(', ');
            document.getElementById('clin-recommendations').value = extracted.recommendations || "";
            
            AppState.activeClinicalTimeline = extracted.timeline_events || [];
            AppState.activeClinicalDocType = doc.document_type;
            
            renderTimeline(extracted.timeline_events || []);
            
            const timelineLine = document.getElementById('timeline-v-line');
            if (timelineLine) timelineLine.style.display = 'block';
            
            navigateTo('medical-records');
            AppState.logAudit("AUTO_CLINICAL_INGEST_TRIGGERED", "medical_records", doc.id, null, { source: doc.filename });
        }
        else if (doc.document_type === 'Policy') {
            const newPolicy = {
                id: `pol-${Date.now()}`,
                payer_name: extracted.payer_name || "Unknown",
                policy_name: extracted.policy_name || "Parsed Policy",
                policy_code: extracted.policy_code || "POL-UNK",
                description: extracted.description || "Policy parsed from document",
                criteria_details: extracted.criteria_details || "",
                status: "Active"
            };
            AppState.db.payer_policies.unshift(newPolicy);
            AppState.saveChanges();
            
            populatePolicyEditor(newPolicy);
            document.getElementById('policy-editor-panel').style.display = 'flex';
            document.getElementById('policy-results').style.display = 'block';
            navigateTo('policy-management');
            AppState.logAudit("AUTO_POLICY_INGEST_TRIGGERED", "payer_policies", newPolicy.id, null, { source: doc.filename });
        }
        
        await loadDbFromBackend(); // Force refresh the frontend state with the new backend records created by extraction
    } catch (e) {
        console.error("Error triggering downstream workflow:", e);
    }
}'''

# Replace from `function triggerDownstreamWorkflow(doc) {` up to `function pollDocumentStatus` or next function
content = re.sub(r'function triggerDownstreamWorkflow\(doc\) \{[\s\S]*?(?=\nfunction fallbackLocalUpload)', new_workflow + '\n\n', content)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('app.js updated successfully.')
