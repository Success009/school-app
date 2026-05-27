# Plan: Parent Support Ticketing System

This document outlines the support ticketing system. Parents can use this system to file administrative or financial queries, which are then managed by administrators and the principal in a structured resolution queue.

---

## 1. Ticket Lifecycle and Status Map

A support ticket serves as an official communication channel for resolving issues (e.g., fee discrepancies, transportation delays).

[ NEW TICKET ] --( Submitted by Parent )
       |
       v
  [ OPENED ]    --( Assigned to Admin / Accountant queue )
       |
  ( Under Investigation / Response Posted )
       |
       v
  [ RESOLVED ]  --( Closed by Admin, verified by Parent )
---

## 2. Database Schema: `/school/tickets/{ticketId}`

Each ticket is assigned a unique ID (e.g., `TK-103982`) and stores key metadata:

json
{
  "id": "TK-103982",
  "studentId": "US-2026-4819",
  "parentPhone": "9800000000",
  "category": "Accounts / Fees",
  "title": "Discrepancy in May Tuition Bill",
  "description": "We were charged twice for computer lab fees this month. Please adjust.",
  "priority": "Medium",
  "status": "Opened",
  "timestamp": 1779881600000,
  "replies": [
    {
      "sender": "Nabin Jha (Accountant)",
      "message": "We are reviewing your ledger. Will correct and post update by tomorrow morning.",
      "timestamp": 1779882200000
    }
  ]
}
---

## 3. UI Implementation Details

### 3.1 Parent Interface (Submit & History)
*   **"Support Tickets" Section:** Added under the Parent Profile menu.
*   **Ticket Submission Form:** A simple form containing:
    *   Category selection dropdown (`Accounts & Billing`, `School Bus / Transport`, `Academics`, `Other`).
    *   Priority indicator (`Low`, `Medium`, `High`).
    *   Title and detailed Description text box.
*   **My Tickets History List:** Shows active and resolved tickets with status badges (e.g., green for resolved, yellow for opened). Clicking a ticket displays the message history and administrative replies.

### 3.2 Admin & Accountant Queue Interface
*   **Unified Support Inbox:** A master dashboard listing all active tickets.
*   **Assignee Routing:** Filters tickets by category (e.g., Accounts tickets automatically route to the Accountant dashboard; Transport/Academic tickets route to the Admin dashboard).
*   **Interactive Response Panel:** Allows administrators or accountants to write a response, append updates to the `replies` array, and change the ticket status to `Resolved`.