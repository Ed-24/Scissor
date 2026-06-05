import { beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Id } from "../../convex/_generated/dataModel";
import AnalyticsDashboard from "./AnalyticsDashboard";
import QRCodeDisplay from "./QRCodeDisplay";
import ShortenForm from "./ShortenForm";

// 1. Mock the Auth Context
vi.mock("../context/useAuthContext", () => ({
  useAuthContext: () => ({
    isSignedIn: false,
    user: null,
    anonymousId: "test-anon-id",
    signOut: vi.fn(),
    signInMock: vi.fn(),
    isMock: true,
  }),
}));

// Helper to extract function path from Convex UDF reference
const getUdfPath = (apiFunc: any) => {
  if (apiFunc && (typeof apiFunc === "object" || typeof apiFunc === "function")) {
    return String(apiFunc._toApiString || apiFunc.name || "");
  }
  return String(apiFunc || "");
};

const mockMutation = vi.fn().mockResolvedValue({ slug: "abc123" });
const mockQuery = vi.fn((apiFunc: any, args?: any) => {
  const path = getUdfPath(apiFunc);

  if (path.includes("checkSlugAvailable")) {
    return args?.slug === "my-brand";
  }

  if (path.includes("listUserLinks")) {
    return [
      {
        _id: "mock-link-id",
        slug: "abc123",
        originalUrl: "https://google.com",
        createdAt: Date.now(),
        status: "active",
        clickCount: 12,
      },
    ];
  }

  if (path.includes("getLinkAnalytics")) {
    return {
      totalClicks: 25,
      clicksOverTime: [{ date: "2026-06-05", count: 25 }],
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
});

// Mock convex/react synchronously to maintain closure references
vi.mock("convex/react", () => ({
  ConvexReactClient: class {
    constructor() {}
  },
  ConvexProvider: ({ children }: any) => children,
  useMutation: () => mockMutation,
  useQuery: (apiFunc: unknown, args?: any) => mockQuery(apiFunc, args),
}));

beforeEach(() => {
  vi.restoreAllMocks();
  window.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
  window.URL.revokeObjectURL = vi.fn();

  mockQuery.mockClear();
  mockQuery.mockImplementation((apiFunc: any, args?: any) => {
    const path = getUdfPath(apiFunc);
    if (path.includes("checkSlugAvailable")) {
      return args?.slug === "my-brand";
    }

    if (path.includes("listUserLinks")) {
      return [
        {
          _id: "mock-link-id",
          slug: "abc123",
          originalUrl: "https://google.com",
          createdAt: Date.now(),
          status: "active",
          clickCount: 12,
        },
      ];
    }

    if (path.includes("getLinkAnalytics")) {
      return {
        totalClicks: 25,
        clicksOverTime: [{ date: "2026-06-05", count: 25 }],
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

      const urlInput = screen.getByPlaceholderText(/very\/long\/path/i);
      fireEvent.change(urlInput, { target: { value: "not-a-valid-url" } });

      await waitFor(() => {
        expect(screen.getByText(/Please enter a fully qualified URL/i)).toBeInTheDocument();
      });
    });

    test("shows validation error for phishing domains", async () => {
      render(<ShortenForm />);

      const urlInput = screen.getByPlaceholderText(/very\/long\/path/i);
      fireEvent.change(urlInput, { target: { value: "https://phishing.com" } });

      await waitFor(() => {
        expect(screen.getByText(/flagged as a phishing hazard/i)).toBeInTheDocument();
      });
    });

    test("toggles custom slug and checks availability", async () => {
      render(<ShortenForm />);

      const slugCheckbox = screen.getByLabelText(/Configure Branded Custom Slug/i);
      fireEvent.click(slugCheckbox);

      const slugInput = screen.getByPlaceholderText("my-custom-slug");
      expect(slugInput).toBeInTheDocument();

      fireEvent.change(slugInput, { target: { value: "my-brand" } });

      await new Promise((resolve) => setTimeout(resolve, 400));

      await waitFor(() => {
        expect(screen.getByText(/available/i)).toBeInTheDocument();
      });
    });
  });

  describe("QRCodeDisplay", () => {
    test("renders QR display and customization controls", () => {
      render(<QRCodeDisplay shortUrl="https://scissor.dev/s/abc123" slug="abc123" />);

      expect(screen.getByText("Customize QR Code")).toBeInTheDocument();
      expect(screen.getByLabelText(/Foreground Color/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Background Color/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Download PNG/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Download SVG/i })).toBeInTheDocument();
    });

    test("updates colors when picked", () => {
      render(<QRCodeDisplay shortUrl="https://scissor.dev/s/abc123" slug="abc123" />);

      const fgInput = screen.getByLabelText(/Foreground Color/i) as HTMLInputElement;
      fireEvent.change(fgInput, { target: { value: "#ff0000" } });
      expect(fgInput.value).toBe("#ff0000");

      const bgInput = screen.getByLabelText(/Background Color/i) as HTMLInputElement;
      fireEvent.change(bgInput, { target: { value: "#000000" } });
      expect(bgInput.value).toBe("#000000");
    });
  });

  describe("AnalyticsDashboard", () => {
    test("renders click metrics and geographic data when clicked", () => {
      render(<AnalyticsDashboard linkId={"mock-link-id" as Id<"links">} onBack={() => {}} />);

      expect(screen.getByText("Click Performance Analytics")).toBeInTheDocument();
      expect(screen.getByText("Total Clicks")).toBeInTheDocument();
      expect(screen.getByText("25")).toBeInTheDocument();
      expect(screen.getByText("United States")).toBeInTheDocument();
      expect(screen.getByText("India")).toBeInTheDocument();
      expect(screen.getByText(/18 clicks/i)).toBeInTheDocument();
      expect(screen.getByText(/7 clicks/i)).toBeInTheDocument();
    });
  });
});
