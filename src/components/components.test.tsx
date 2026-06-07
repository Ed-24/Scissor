import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Id } from "../../convex/_generated/dataModel";
import AnalyticsDashboard from "./AnalyticsDashboard";
import Dashboard from "./Dashboard";
import QRCodeDisplay from "./QRCodeDisplay";
import ShortenForm from "./ShortenForm";

type MockApiFunction = {
  _toApiString?: string;
  name?: string;
};

type MutationArgs = {
  customSlug?: string;
  [key: string]: unknown;
};

type QueryArgs = {
  slug?: string;
  linkId?: string;
  [key: string]: unknown;
} | "skip";

const toastMock = vi.fn();
const mutationMock = vi.fn(async (args: MutationArgs = {}) => {
  if (args && "customSlug" in args) {
    return { slug: args.customSlug || "abc123" };
  }
  return null;
});

const mockLinks = [
  {
    _id: "mock-link-id-1",
    slug: "abc123",
    originalUrl: "https://google.com/search?q=scissor",
    createdAt: Date.now() - 86_400_000,
    expiresAt: Date.now() + 86_400_000,
    status: "active",
    clickCount: 12,
  },
  {
    _id: "mock-link-id-2",
    slug: "old-link",
    originalUrl: "https://microsoft.com",
    createdAt: Date.now() - 172_800_000,
    expiresAt: Date.now() - 1_000,
    status: "expired",
    clickCount: 3,
  },
];

const getUdfPath = (apiFunc: MockApiFunction | null | undefined) => String(apiFunc?._toApiString || apiFunc?.name || "");

vi.mock("../context/useAuthContext", () => ({
  useAuthContext: () => ({
    isLoaded: true,
    isSignedIn: true,
    isMock: false,
    user: {
      id: "user_1",
      fullName: "Edith",
      primaryEmailAddress: "edith@example.com",
      imageUrl: null,
    },
    signOut: vi.fn(),
    openSignIn: vi.fn(),
    openSignUp: vi.fn(),
  }),
}));

vi.mock("../context/ToastContext", () => ({
  useToast: () => ({
    toasts: [],
    toast: toastMock,
    dismissToast: vi.fn(),
  }),
}));

vi.mock("convex/react", () => ({
  ConvexProvider: ({ children }: { children: ReactNode }) => children,
  ConvexReactClient: class {
    constructor() {}
  },
  useMutation: () => mutationMock,
  useQuery: (apiFunc: MockApiFunction, args?: QueryArgs) => {
    const path = getUdfPath(apiFunc);

    if (path.includes("checkSlugAvailable")) {
      if (args !== "skip" && args && args.slug === "taken-slug") {
        return false;
      }
      return true;
    }

    if (path.includes("listUserLinks")) {
      return mockLinks;
    }

    if (path.includes("getLinkAnalytics")) {
      return {
        totalClicks: 25,
        uniqueClicks: 19,
        clicksOverTime: [
          { date: "2026-06-01", count: 3 },
          { date: "2026-06-02", count: 5 },
          { date: "2026-06-03", count: 17 },
        ],
        referrers: [
          { referrer: "Twitter", count: 15 },
          { referrer: "Google", count: 10 },
        ],
        devices: [
          { device: "Mobile", count: 20 },
          { device: "Desktop", count: 5 },
        ],
        countries: [
          { country: "US", count: 18 },
          { country: "IN", count: 7 },
        ],
      };
    }

    return undefined;
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  window.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
  window.URL.revokeObjectURL = vi.fn();
  mutationMock.mockImplementation(async (args: MutationArgs = {}) => {
    if (args && "customSlug" in args) {
      return { slug: args.customSlug || "abc123" };
    }
    return null;
  });
});

describe("Scissor Frontend - Component Tests", () => {
  describe("ShortenForm", () => {
    test("renders form inputs and submit button", () => {
      render(<ShortenForm />);

      expect(screen.getByPlaceholderText(/very\/long\/path/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Get Shortened Link/i })).toBeInTheDocument();
    });

    test("shows validation error for malformed URLs", async () => {
      render(<ShortenForm />);

      fireEvent.change(screen.getByPlaceholderText(/very\/long\/path/i), { target: { value: "not-a-valid-url" } });

      fireEvent.click(screen.getByRole("button", { name: /Get Shortened Link/i }));

      await waitFor(() => {
        expect(screen.getByText(/Please enter a fully qualified URL/i)).toBeInTheDocument();
      });
    });

    test("shows validation error for phishing domains", async () => {
      render(<ShortenForm />);

      fireEvent.change(screen.getByPlaceholderText(/very\/long\/path/i), { target: { value: "https://phishing.com" } });

      fireEvent.click(screen.getByRole("button", { name: /Get Shortened Link/i }));

      await waitFor(() => {
        expect(screen.getByText(/blocked by Scissor's phishing protection/i)).toBeInTheDocument();
      });
    });

    test("toggles custom slug and checks availability", async () => {
      render(<ShortenForm />);

      fireEvent.click(screen.getByLabelText(/Add a custom slug/i));
      const slugInput = screen.getByPlaceholderText("my-brand");
      fireEvent.change(slugInput, { target: { value: "my-brand" } });

      await waitFor(() => {
        expect(screen.getByText(/Available/i)).toBeInTheDocument();
      });
    });
  });

  describe("Dashboard", () => {
    test("renders links table and supports row actions", async () => {
      render(<Dashboard onSelectLink={vi.fn()} />);

      expect(await screen.findByText(/Manage links at a glance/i)).toBeInTheDocument();
      expect(screen.getByText(/google.com\/search/i)).toBeInTheDocument();
      expect(screen.getByText(/microsoft.com/i)).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("select-abc123"));
      expect(screen.getByRole("button", { name: /Delete selected/i })).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("qr-toggle-abc123"));
      expect(screen.getByText(/Customize and download/i)).toBeInTheDocument();
    });
  });

  describe("QRCodeDisplay", () => {
    test("renders QR display and customization controls", () => {
      render(<QRCodeDisplay shortUrl="https://scissor.dev/s/abc123" slug="abc123" />);

      expect(screen.getByText("Customize and download")).toBeInTheDocument();
      expect(screen.getByLabelText(/Foreground/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Background/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Download PNG/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Download SVG/i })).toBeInTheDocument();
    });

    test("updates colors when picked", () => {
      render(<QRCodeDisplay shortUrl="https://scissor.dev/s/abc123" slug="abc123" />);

      const fgInput = screen.getByLabelText(/Foreground/i) as HTMLInputElement;
      fireEvent.change(fgInput, { target: { value: "#ff0000" } });
      expect(fgInput.value).toBe("#ff0000");

      const bgInput = screen.getByLabelText(/Background/i) as HTMLInputElement;
      fireEvent.change(bgInput, { target: { value: "#000000" } });
      expect(bgInput.value).toBe("#000000");
    });
  });

  describe("AnalyticsDashboard", () => {
    test("renders click metrics and geographic data when clicked", () => {
      render(<AnalyticsDashboard linkId={"mock-link-id-1" as Id<"links">} onBack={() => {}} />);

      expect(screen.getByText("Realtime click performance")).toBeInTheDocument();
      expect(screen.getByText("25", { selector: "#total-clicks-count" })).toBeInTheDocument();
      expect(screen.getByText("19", { selector: "#unique-clicks-count" })).toBeInTheDocument();
      expect(within(screen.getByTestId("country-US")).getByText("United States")).toBeInTheDocument();
      expect(within(screen.getByTestId("country-IN")).getByText("India")).toBeInTheDocument();
      expect(screen.getByText(/18 clicks/i)).toBeInTheDocument();
      expect(screen.getByText(/7 clicks/i)).toBeInTheDocument();
    });
  });
});
