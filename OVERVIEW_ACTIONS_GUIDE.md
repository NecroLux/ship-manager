# Overview & Actions Tabs Guide

## Overview Tab

The Overview tab provides a high-level summary of crew status and key action items at a glance.

### Key Metrics
- **Total Sailors**: Count of all active crew members from the Voyage Awards sheet
- **Awards Given**: Total number of awards, medals, and promotions granted
- **Action Items**: Count of sailors requiring attention or follow-up
- **Promotion Ready**: Sailors eligible for rank advancement

### Sailors Requiring Attention
Automatically identifies sailors with:
- **Incomplete Profiles**: Missing or incomplete profile information
- **Priority Indicators**: Flagged by priority level (High, Medium, Low)

### Promotion Candidates
Displays sailors ready for advancement based on:
- Rank and role progression criteria
- Performance metrics from the data sheet
- Service records and achievement history

### Low Activity Sailors
Highlights crew members with:
- Low Discord engagement levels
- Incomplete activity tracking
- Below-average participation metrics

**Note**: The analysis algorithms are currently simulated. Once your complete data structure is defined, the logic can be fine-tuned to match your specific business rules.

---

## Actions Tab

The Actions tab is designed for leadership to track responsibilities and action items across all ranks.

### Role-Based Tabs
Navigate between different leadership roles:

1. **Command** (Commanding Officer)
   - Strategic decision-making and crew evaluations
   - Promotion approvals and major operations
   - Long-term ship and crew development

2. **First Officer**
   - Day-to-day operations coordination
   - Training program management
   - Crew satisfaction and morale tracking

3. **Chief of Ship**
   - Ship maintenance and supplies
   - Safety protocol enforcement
   - Technical operations oversight

4. **Squad Leaders**
   - Squad-level performance monitoring
   - Attendance and engagement tracking
   - Crew mentorship and development

### Action Item Fields
Each action item displays:
- **Action Item**: Description of the task
- **Due Date**: Target completion date (optional)
- **Status**: Pending, In Progress, or Completed
- **Priority**: High, Medium, or Low
- **Actions**: Quick buttons to update status or edit details

### Role-Specific Guidance
Each role tab includes:
- Summary of responsibilities
- Current action workload breakdown
- Role-specific notes and best practices

### Customization
The Actions tab is currently populated with template data. To integrate with your actual data:
1. Add an "Actions" or "Leadership" sheet to your Google Sheets
2. Include columns for: Role, Action Item, Due Date, Status, Priority, Assigned To
3. Update the `ActionsTab.tsx` component to fetch from this sheet
4. Implement status update functionality to write changes back to Google Sheets

---

## Data Integration

### Current Implementation
Both tabs analyze data from:
- **Voyage Awards Sheet** (filtered for active sailors)
- **Gullinbursti Sheet** (member roster and participation data)

### Future Enhancements
To fully utilize these tabs, consider adding:
1. **Actions Sheet**: Dedicated sheet for leadership action items
2. **Performance Data**: Structured metrics for promotion readiness
3. **Discord Integration**: API connection for real-time activity data
4. **Activity Log**: Timestamp-based tracking of crew engagement

### Backend Integration Points
The tabs already use the `useSheetData()` hook, so connecting real data is straightforward:
1. Update data fetch logic in `SheetDataContext.tsx`
2. Modify analysis functions to parse your actual data structure
3. Implement backend endpoints for writing changes back to sheets

---

## Tips for Leadership

### Using the Overview Tab
- **Daily Briefing**: Start each day by reviewing action items
- **Trend Monitoring**: Check activity levels weekly to identify engagement issues
- **Award Recognition**: Use award counts to recognize top performers

### Using the Actions Tab
- **Weekly Review**: Check pending items and adjust priorities as needed
- **Status Updates**: Mark completed items to maintain accurate workload visibility
- **Planning**: Use role-specific guidance when assigning new responsibilities
- **Delegation**: Balance action items evenly across similar roles

### Best Practices
- Respond to high-priority items within 24-48 hours
- Encourage squad leaders to monitor Discord activity daily
- Hold weekly command meetings to review and reassign actions
- Document completed actions for crew records

