import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServerRequestError } from "@/fetch";
import { useSession } from "@/features/auth/hooks/use-session";
import { WorkspaceDetailPage } from "@/features/workspaces/pages/WorkspaceDetailPage";

const { mockNavigate, mockedUseQuery } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockedUseQuery: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === "workspaces.workspaceTitle") {
        return `Workspace: ${options?.["name"] ?? ""}`;
      }
      const labels: Record<string, string> = {
        "workspaces.appInfoActionLink": "App Info",
        "workspaces.appInfoCreateRp": "Create RP",
        "nav.home": "Home",
        "workspaces.appInfoColumnLabel": "Application Information",
        "workspaces.appInfoCreateButton": "Create application information",
        "workspaces.appInfoManageRp": "Manage RP",
        "workspaces.appInfoRpColumnLabel": "Relying Party",
        "workspaces.appInfoManageContacts": "Manage contacts",
        "workspaces.appInfoContactsColumnLabel": "Contacts",
        "workspaces.appInfoSectionTitle": "Application Information",
        "workspaces.back": "Back",
        "workspaces.createApplication": "Create application",
        "workspaces.errorLoading": "Error loading workspace",
        "workspaces.errorLoadingApplicationInfo": "Error loading application information",
        "workspaces.loading": "Loading workspace",
        "workspaces.loadingApplicationInfo": "Loading application information",
        "workspaces.noApplicationInfo": "No application information",
        "workspaces.title": "Workspaces",
      };
      return labels[key] ?? key;
    },
  }),
}));

vi.mock("@tanstack/react-query", () => ({ useQuery: mockedUseQuery }));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ workspaceUuid: "workspace-uuid-1" }),
}));
vi.mock("@/components/layout", () => ({
  Breadcrumbs: () => <nav>Breadcrumbs</nav>,
  CenteredPageLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/ui/Toast", () => ({ useToast: () => ({ error: vi.fn(), success: vi.fn() }) }));
vi.mock("@/components/ui", () => ({
  Button: ({ children, onGcdsClick, type = "button" }: any) => <button type={type} onClick={onGcdsClick}>{children}</button>,
  DataTable: ({ action = [], columns = [], rows = [], title }: any) => {
    const actions = Array.isArray(action) ? action : action ? [action] : [];

    return (
      <section>
        {title ? <h2>{title}</h2> : null}
        <div>
          {columns.map((column: any) => <span key={column.field}>{column.headerName}</span>)}
          {actions.length > 0 ? <span>Actions</span> : null}
        </div>
        {rows.map((row: any) => (
          <div key={row.uuid}>
            {columns.map((column: any) => (
              <div key={column.field}>
                {column.cellRenderer ? column.cellRenderer(row) : <p>{String(row[column.field] ?? "")}</p>}
              </div>
            ))}
            {actions.map((item: any) => (item.isVisible?.(row) ?? true ? <button key={item.buttonId(row)} onClick={() => item.onAction(row)}>{item.buttonLabel}</button> : null))}
          </div>
        ))}
      </section>
    );
  },
  Heading: ({ children }: any) => <h1>{children}</h1>,
  Notice: ({ children, noticeTitle }: any) => <section>{noticeTitle ? <h2>{noticeTitle}</h2> : null}{children}</section>,
  Text: ({ children }: any) => <p>{children}</p>,
}));
vi.mock("@/features/workspaces/components/ApplicationInfoModal", () => ({ ApplicationInfoModal: () => null }));
vi.mock("@/features/workspaces/components/WorkspaceApplicationModal", () => ({
  WorkspaceApplicationModal: ({ createContext, isOpen }: any) => isOpen ? <section><p>application-modal-open</p><p>{createContext?.applicationInfoUuid}</p><p>{createContext?.initialForm?.name}</p></section> : null,
}));
vi.mock("@/features/auth/hooks/use-session", () => ({ useSession: vi.fn() }));

const workspace = { departmentId: 7, name: "Workspace One", uuid: "workspace-uuid-1" };
const applicationInfo = {
  applicationDescription: "Benefits access for citizens",
  applicationName: "Benefits Portal",
  applicationUrl: "https://benefits.example.gc.ca",
  rpApplicationUuid: null,
  uuid: "application-info-uuid-1",
};

function makeQueryResult<T>(data: T, overrides?: Partial<{ error: Error | null; isError: boolean; isLoading: boolean }>) {
  return { data, error: null, isError: false, isLoading: false, refetch: vi.fn(async () => undefined), ...overrides };
}

function mockQuerySequence(overrides?: { workspace?: any; applicationInfos?: any; members?: any; department?: any }) {
  mockedUseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    const key = queryKey[0];
    if (key === "workspace") {
      return { ...makeQueryResult(workspace), ...overrides?.workspace };
    }
    if (key === "workspace-application-info") {
      return { ...makeQueryResult([applicationInfo]), ...overrides?.applicationInfos };
    }
    if (key === "workspace-members") {
      return {
        ...makeQueryResult([
          { role: "workspace_admin", userUuid: "user-uuid-1", uuid: "member-uuid-1" },
        ]),
        ...overrides?.members,
      };
    }
    if (key === "department") {
      return { ...makeQueryResult({ name: "Department Name" }), ...overrides?.department };
    }
    return makeQueryResult(undefined);
  });
}

describe("WorkspaceDetailPage", () => {
  beforeEach(() => {
    mockedUseQuery.mockReset();
    mockNavigate.mockReset();
    vi.mocked(useSession).mockReturnValue({ currentUser: { uuid: "user-uuid-1" } } as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("opens a prefilled create modal from the application info action", async () => {
    mockQuerySequence();
    render(<WorkspaceDetailPage />);
    expect(screen.getAllByText("Application Information").length).toBeGreaterThan(0);
    expect(screen.getByText("Contacts")).toBeTruthy();
    expect(screen.getByText("Relying Party")).toBeTruthy();
    expect(screen.getByText("Actions")).toBeTruthy();
    expect(screen.getByRole("button", { name: /^app info$/i })).toBeTruthy();
    fireEvent.click(await screen.findByRole("button", { name: /^create rp$/i }));
    expect(screen.getByText("application-modal-open")).toBeTruthy();
    expect(screen.getByText("application-info-uuid-1")).toBeTruthy();
    expect(screen.getAllByText("Benefits Portal")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /^manage contacts$/i })).toBeTruthy();
  });

  it("navigates to the application info detail page from the action column", async () => {
    mockQuerySequence();
    render(<WorkspaceDetailPage />);
    fireEvent.click(await screen.findByRole("button", { name: /^app info$/i }));
    expect(mockNavigate).toHaveBeenCalledWith({ params: { applicationInfoUuid: "application-info-uuid-1", workspaceUuid: "workspace-uuid-1" }, to: "/workspaces/$workspaceUuid/application-info/$applicationInfoUuid" });
  });

  it("navigates to the linked RP application from the application info action", async () => {
    mockQuerySequence({ applicationInfos: { data: [{ ...applicationInfo, rpApplicationUuid: "application-uuid-1" }] } });
    render(<WorkspaceDetailPage />);
    fireEvent.click(await screen.findByRole("button", { name: /^manage rp$/i }));
    expect(mockNavigate).toHaveBeenCalledWith({ params: { rpApplicationUuid: "application-uuid-1", workspaceUuid: "workspace-uuid-1" }, to: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid" });
  });

  it("hides application actions for non-admin members", async () => {
    vi.mocked(useSession).mockReturnValue({ currentUser: { uuid: "user-uuid-2" } } as never);
    mockQuerySequence({ members: { data: [{ role: "viewer", userUuid: "user-uuid-2", uuid: "member-uuid-2" }] } });
    render(<WorkspaceDetailPage />);
    await screen.findByRole("heading", { name: /workspace: workspace one/i });
    expect(screen.queryByRole("button", { name: /^app info$/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^create rp$/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^manage rp$/i })).toBeNull();
  });

  it("shows the backend workspace error message in the notice", async () => {
    mockQuerySequence({ workspace: { data: undefined, error: new ServerRequestError({ detail: "Workspace service temporarily unavailable.", status: 503 }), isError: true } });
    render(<WorkspaceDetailPage />);
    expect(await screen.findByText("Workspace service temporarily unavailable.")).toBeTruthy();
  });
});
