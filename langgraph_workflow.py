# ClaimShield AI - LangGraph Multi-Agent Workflow
# Reusable stateful agent communication graph for enterprise denial appeals

import json
from typing import Dict, List, Any, TypedDict, Literal

# ============================================================================
# 1. State Definition
# ============================================================================
class AgentState(TypedDict):
    """The shared state passed between agents in the LangGraph workflow."""
    raw_document: str
    patient_id: str
    claim_id: str
    extracted_metadata: Dict[str, Any]
    clinical_insights: Dict[str, Any]
    policy_rules: Dict[str, Any]
    evidence_mappings: List[Dict[str, Any]]
    appeal_letter: str
    compliance_passed: bool
    compliance_feedback: str
    next_tasks: List[str]
    history: List[str] # Audit list tracking agent transitions

# ============================================================================
# 2. Agent Node Definitions
# ============================================================================
def intake_agent_node(state: AgentState) -> Dict[str, Any]:
    """1. Intake Agent: Extracts patient, payer, claim numbers, and deadlines."""
    print("[Agent: Intake] Parsing raw document for metadata extraction...")
    raw = state["raw_document"]
    
    # Simulating metadata parsing logic
    extracted = {
        "claim_number": "CLM-98741",
        "payer": "UnitedHealthcare",
        "patient_name": "Sarah Jenkins",
        "denial_code": "CO-197",
        "denial_reason": "Pre-certification/authorization absent"
    }
    
    history = list(state.get("history", []))
    history.append("Intake Agent extracted claim metadata.")
    
    return {
        "extracted_metadata": extracted,
        "history": history
    }

def clinical_agent_node(state: AgentState) -> Dict[str, Any]:
    """2. Clinical Agent: Extracts diagnoses, symptoms, and prior treatments."""
    print("[Agent: Clinical] Extracting symptoms and clinical notes...")
    
    # Extracting medical necessity clinical details
    insights = {
        "diagnoses": ["I25.110 (Unstable angina)"],
        "symptoms": ["Crushing retrosternal chest pain (8/10)", "Left arm radiation"],
        "failed_treatments": ["Outpatient Nitroglycerin spray therapy"],
        "risk_factors": ["Hypertension", "Smoking history"],
        "clinical_urgency": "Emergency STEMI indicators present"
    }
    
    history = list(state.get("history", []))
    history.append("Clinical Agent extracted patient clinical insights.")
    
    return {
        "clinical_insights": insights,
        "history": history
    }

def policy_agent_node(state: AgentState) -> Dict[str, Any]:
    """3. Policy Agent: Searches guidelines and coverage criteria details."""
    print("[Agent: Policy] Querying insurance policies knowledge base...")
    
    # Querying Aetna/UHC cardiology criteria
    policy = {
        "policy_code": "CPB-0982",
        "coverage_criteria": "Acute admission is covered under emergency cardiological criteria.",
        "exclusions": "Elective angiography without chest pain symptoms.",
        "authorization_rules": "Prior auth waived for emergency room cardiology referrals."
    }
    
    history = list(state.get("history", []))
    history.append("Policy Agent retrieved insurance coverage criteria.")
    
    return {
        "policy_rules": policy,
        "history": history
    }

def evidence_agent_node(state: AgentState) -> Dict[str, Any]:
    """4. Evidence Agent: Cross-references clinical chart vs policy rules."""
    print("[Agent: Evidence] Mapping medical chart findings to policy criteria...")
    
    # Aligning clinical markers with policy coverage points
    mappings = [
        {
            "requirement": "Emergency presentation threshold met",
            "chart_evidence": "Presented with crushing chest pain 8/10 requiring immediate ICU admission",
            "status": "Match"
        },
        {
            "requirement": "Outpatient settings ruled out",
            "chart_evidence": "Failed prior outpatient Nitroglycerin treatments",
            "status": "Match"
        }
    ]
    
    history = list(state.get("history", []))
    history.append("Evidence Agent mapped clinical indicators to coverage criteria.")
    
    return {
        "evidence_mappings": mappings,
        "history": history
    }

def appeal_agent_node(state: AgentState) -> Dict[str, Any]:
    """5. Appeal Agent: Drafts the clinical appeal letter using evidence details."""
    print("[Agent: Appeal] Drafting medical necessity appeal letter...")
    metadata = state["extracted_metadata"]
    clinical = state["clinical_insights"]
    policy = state["policy_rules"]
    evidence = state["evidence_mappings"]
    
    # Check if this is a revision loop
    is_revision = "revision" in state.get("compliance_feedback", "").lower()
    revision_note = f"\n[Revised following compliance feedback: {state.get('compliance_feedback')}]" if is_revision else ""
    
    letter = (
        f"RE: Medical Necessity Appeal for Claim {metadata['claim_number']}{revision_note}\n\n"
        f"Patient: {metadata['patient_name']}\n"
        f"Payer: {metadata['payer']}\n\n"
        f"Dear Appeals Committee,\n\n"
        f"We dispute the denial (Code {metadata['denial_code']}) for cardiology care. "
        f"The patient presented with {clinical['symptoms'][0]}. Under policy rules {policy['policy_code']}, "
        f"prior authorization is waived for acute emergency presentations. Patient has failed prior "
        f"conservative treatments: {', '.join(clinical['failed_treatments'])}.\n\n"
        f"Sincerely,\nCardiology Department"
    )
    
    history = list(state.get("history", []))
    history.append("Appeal Agent drafted/revised the appeal letter.")
    
    return {
        "appeal_letter": letter,
        "history": history
    }

def compliance_agent_node(state: AgentState) -> Dict[str, Any]:
    """6. Compliance Agent: Audits appeal letter for HIPAA, regulations, and formats."""
    print("[Agent: Compliance] Auditing draft letter for compliance rules...")
    letter = state["appeal_letter"]
    
    # Simulating review check
    # If this is the first draft, let's trigger a revision loop once for demonstration, then pass on second check
    revision_count = sum(1 for h in state.get("history", []) if "revised" in h.lower())
    
    passed = True
    feedback = "Approved for HIPAA and billing compliance rules."
    
    if revision_count == 0:
        passed = False
        feedback = "Revision required: Add physician licensing details and policy waiver reference."
        print("[Agent: Compliance] Rejecting first draft: Needs revision.")
    else:
        print("[Agent: Compliance] Approving revised draft.")
        
    history = list(state.get("history", []))
    history.append(f"Compliance Agent completed review. Result: {'Pass' if passed else 'Fail'}")
    
    return {
        "compliance_passed": passed,
        "compliance_feedback": feedback,
        "history": history
    }

def follow_up_agent_node(state: AgentState) -> Dict[str, Any]:
    """7. Follow Up Agent: Logs tasks, creates audit trails, and tracks outcomes."""
    print("[Agent: Follow Up] Creating follow-up checklist tasks...")
    
    tasks = [
        "Task: Fax completed appeal letter to UnitedHealthcare appeals portal",
        "Task: Notify patient Sarah Jenkins of appeal filing status",
        "Task: Verify appeal status in 14 days"
    ]
    
    history = list(state.get("history", []))
    history.append("Follow Up Agent created tracking tasks and finalized workflow.")
    
    return {
        "next_tasks": tasks,
        "history": history
    }

# ============================================================================
# 3. LangGraph Workflow Compilation (With Try-Except for LangGraph installation)
# ============================================================================
try:
    from langgraph.graph import StateGraph, END
    
    # Initialize LangGraph StateGraph
    workflow = StateGraph(AgentState)
    
    # Register Nodes
    workflow.add_node("intake", intake_agent_node)
    workflow.add_node("clinical", clinical_agent_node)
    workflow.add_node("policy", policy_agent_node)
    workflow.add_node("evidence", evidence_agent_node)
    workflow.add_node("appeal", appeal_agent_node)
    workflow.add_node("compliance", compliance_agent_node)
    workflow.add_node("follow_up", follow_up_agent_node)
    
    # Establish Edges
    workflow.set_entry_point("intake")
    workflow.add_edge("intake", "clinical")
    workflow.add_edge("clinical", "policy")
    workflow.add_edge("policy", "evidence")
    workflow.add_edge("evidence", "appeal")
    workflow.add_edge("appeal", "compliance")
    
    # Conditional Routing (Review Loop)
    def determine_compliance_route(state: AgentState) -> Literal["appeal", "follow_up"]:
        if state["compliance_passed"]:
            return "follow_up"
        return "appeal"
        
    workflow.add_conditional_edges(
        "compliance",
        determine_compliance_route,
        {
            "appeal": "appeal",        # Revisits Appeal Agent (Revision Loop)
            "follow_up": "follow_up"   # Advances to Follow Up Agent
        }
    )
    
    workflow.add_edge("follow_up", END)
    
    # Compile Graph
    compiled_graph = workflow.compile()
    print("[LangGraph] State Graph successfully compiled.")

except ImportError:
    # Safe Fallback Simulator if langgraph package is not loaded
    class MockLangGraph:
        def __init__(self):
            print("[LangGraph Fallback] LangGraph package not found. Using built-in graph execution simulator.")

        def run(self, initial_state: AgentState) -> AgentState:
            state = initial_state.copy()
            
            # Step 1: Intake
            res = intake_agent_node(state)
            state.update(res)
            
            # Step 2: Clinical
            res = clinical_agent_node(state)
            state.update(res)
            
            # Step 3: Policy
            res = policy_agent_node(state)
            state.update(res)
            
            # Step 4: Evidence
            res = evidence_agent_node(state)
            state.update(res)
            
            # Step 5: Appeal (First draft)
            res = appeal_agent_node(state)
            state.update(res)
            
            # Step 6: Compliance (Will fail first draft)
            res = compliance_agent_node(state)
            state.update(res)
            
            # Revision loop check (Condition edge)
            if not state["compliance_passed"]:
                print("[Graph Link] Routing back to Appeal Agent due to compliance feedback...")
                # Step 5 (Revised Draft)
                res = appeal_agent_node(state)
                state.update(res)
                # Step 6 (Second Compliance review - passes)
                res = compliance_agent_node(state)
                state.update(res)
                
            # Step 7: Follow Up
            if state["compliance_passed"]:
                print("[Graph Link] Advancing to Follow Up Agent...")
                res = follow_up_agent_node(state)
                state.update(res)
                
            return state

    compiled_graph = MockLangGraph()


# ============================================================================
# 4. Optional FastAPI service endpoints to trigger execution
# ============================================================================
try:
    from fastapi import FastAPI
    from pydantic import BaseModel
    
    app = FastAPI(title="ClaimShield LangGraph Agent API", version="1.0")
    
    class WorkflowRequest(BaseModel):
        raw_document: str
        patient_id: str
        claim_id: str

    @app.post("/api/agents/run-workflow")
    def run_agents(req: WorkflowRequest):
        initial_state: AgentState = {
            "raw_document": req.raw_document,
            "patient_id": req.patient_id,
            "claim_id": req.claim_id,
            "extracted_metadata": {},
            "clinical_insights": {},
            "policy_rules": {},
            "evidence_mappings": [],
            "appeal_letter": "",
            "compliance_passed": False,
            "compliance_feedback": "",
            "next_tasks": [],
            "history": []
        }
        
        # Execute workflow graph (either compiled LangGraph or fallback simulator)
        if hasattr(compiled_graph, 'run'):
            final_state = compiled_graph.run(initial_state)
        else:
            # LangGraph compiled execute API
            final_state = compiled_graph.invoke(initial_state)
            
        return {
            "status": "success",
            "history": final_state["history"],
            "metadata": final_state["extracted_metadata"],
            "evidence": final_state["evidence_mappings"],
            "appeal_letter": final_state["appeal_letter"],
            "compliance_passed": final_state["compliance_passed"],
            "compliance_feedback": final_state["compliance_feedback"],
            "generated_tasks": final_state["next_tasks"]
        }

except ImportError:
    pass

# Direct execution script runner check
if __name__ == "__main__":
    test_state: AgentState = {
        "raw_document": "PAYER: UHC, Claim: CLM-98741, Patient: Sarah Jenkins, Medical Necessity criteria absent.",
        "patient_id": "p-1",
        "claim_id": "clm-1",
        "extracted_metadata": {},
        "clinical_insights": {},
        "policy_rules": {},
        "evidence_mappings": [],
        "appeal_letter": "",
        "compliance_passed": False,
        "compliance_feedback": "",
        "next_tasks": [],
        "history": []
    }
    print("--- STARTING LANGGRAPH AGENTS WORKFLOW SIMULATION ---")
    if hasattr(compiled_graph, 'run'):
        result_state = compiled_graph.run(test_state)
    else:
        result_state = compiled_graph.invoke(test_state)
    print("\n--- WORKFLOW EXECUTION COMPLETE ---")
    print("Workflow History Ledger:")
    for entry in result_state["history"]:
        print(f" - {entry}")
    print("\nFinal Appeal Letter Draft:")
    print(result_state["appeal_letter"])
    print("\nGenerated Follow-Up Checklist Tasks:")
    for task in result_state["next_tasks"]:
        print(f" - {task}")
