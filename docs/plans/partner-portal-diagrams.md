# CanadaLogin Partner Portal Diagrams

## Document Status

- Status: Draft
- Date: 2026-05-13
- Purpose: Companion architecture and workflow diagrams for the product PRD

## 1. System Architecture

```mermaid
flowchart LR
    subgraph Users[User Personas]
        SA[Platform Superuser]
        WA[Workspace Administrator]
        WM[Workspace Member]
        ID[Invited External Developer]
    end

    subgraph FE[Frontend]
        UI[React + TanStack Router Portal UI]
        Dashboard[Dashboard and Admin Modules]
        WorkspaceUI[Workspace and RP Application Flows]
    end

    subgraph BE[Backend]
        API[FastAPI API Layer]
        Auth[OIDC and Session Handling]
        Access[Casbin Authorization]
        WorkspaceSvc[Workspace Service]
        IBMService[IBM Verify Admin Service]
        InviteSvc[Invitation and GC Notify Service]
        Tasks[ARQ Tasks]
    end

    subgraph Data[Data Stores]
        PG[(PostgreSQL)]
        Redis[(Redis)]
    end

    subgraph External[External Services]
        OIDC[OIDC Identity Provider]
        IBM[IBM Security Verify]
        Notify[GC Notify]
    end

    SA --> UI
    WA --> UI
    WM --> UI
    ID --> UI

    UI --> Dashboard
    UI --> WorkspaceUI
    Dashboard --> API
    WorkspaceUI --> API

    API --> Auth
    API --> Access
    API --> WorkspaceSvc
    API --> IBMService
    API --> InviteSvc
    API --> Tasks

    Auth --> OIDC
    Auth --> Redis
    WorkspaceSvc --> PG
    Access --> PG
    IBMService --> IBM
    InviteSvc --> Notify
    Tasks --> Redis
```

## 2. Workspace And RP Application Domain Model

```mermaid
flowchart TD
    Department[Department]
    User[User]
    Role[Role]
    Tier[Tier]
    Workspace[Workspace]
    Member[Workspace Member]
    AppInfo[Application Information]
    Contact[Application Contact]
    RPApp[RP Application]
    Invite[RP Application Developer Invitation]
    Usage[Usage and Audit Data]

    Department --> User
    Department --> Workspace
    Role --> User
    Tier --> User
    User --> Member
    Workspace --> Member
    Workspace --> AppInfo
    AppInfo --> Contact
    Workspace --> RPApp
    AppInfo --> RPApp
    RPApp --> Invite
    RPApp --> Usage
    User --> Invite
```

## 3. Invited Developer Workflow

```mermaid
sequenceDiagram
    participant Admin as Workspace Admin
    participant Portal as Partner Portal
    participant Notify as GC Notify
    participant Invitee as Invited Developer
    participant OIDC as OIDC Provider
    participant API as Backend API

    Admin->>Portal: Open RP application developer invitations page
    Admin->>Portal: Submit invitee email
    Portal->>API: Create invitation for RP application
    API->>Notify: Send invitation email with tokenized link
    Notify-->>Invitee: Invitation email delivered

    Invitee->>OIDC: Sign in with invited email
    OIDC-->>Portal: Authenticated session callback
    Invitee->>Portal: Open invitation link with token
    Portal->>API: Accept invitation token
    API->>API: Validate token, email, state, expiry
    API-->>Portal: Invitation accepted
    Portal-->>Invitee: Redirect to current-user RP application page
    Invitee->>Portal: View and edit scoped RP application details
```

## 4. Internal Onboarding Workflow

```mermaid
flowchart TD
    Login[User Signs In] --> Session{Authenticated Session Exists?}
    Session -- No --> OIDCLogin[Redirect to OIDC Login]
    OIDCLogin --> DepartmentCheck
    Session -- Yes --> DepartmentCheck{Department Set?}
    DepartmentCheck -- No --> ProfileSetup[Profile Setup: Select Department]
    ProfileSetup --> Dashboard[Dashboard]
    DepartmentCheck -- Yes --> Dashboard

    Dashboard --> Workspaces[Open Workspaces]
    Workspaces --> WorkspaceDetail[Workspace Detail]
    WorkspaceDetail --> AppInfo[Create or Update Application Information]
    AppInfo --> Contacts[Manage Application Contacts]
    Contacts --> RPApp[Create or Update RP Application]
    RPApp --> Credentials[View Credentials or Rotate Secret]
    RPApp --> Usage[Review Usage and Audit Trail]
```

## 5. Future-State Workflow Anchor

This diagram captures the intended future workflow implied by the backlog and PRD roadmap.

```mermaid
flowchart LR
    Draft[Draft] --> Ready[Ready for Review]
    Ready --> Review[Under Review]
    Review --> Changes[Changes Requested]
    Changes --> Draft
    Review --> Approved[Approved]
    Approved --> Operational[Operational]
    Operational --> Ongoing[Ongoing Monitoring and Rotation]
```
