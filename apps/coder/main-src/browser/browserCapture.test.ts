import { describe, expect, it } from "vitest";
import {
  addBrowserCaptureExternalRequestForHostId,
  type BrowserCaptureRequestDetail,
  clearBrowserCaptureDataForHostId,
  extractBrowserCaptureGuestBindingsFromState,
  filterBrowserCaptureRequestDetails,
  listBrowserCaptureRequestsForHostId,
  matchesBrowserCaptureStatusGroup,
  startBrowserCaptureForHostId,
  stopBrowserCaptureForHostId,
} from "./browserCapture.js";

describe("extractBrowserCaptureGuestBindingsFromState", () => {
  it("keeps valid tab to guest bindings and drops invalid rows", () => {
    const bindings = extractBrowserCaptureGuestBindingsFromState({
      guestBindings: [
        { tabId: "tab-1", webContentsId: 101 },
        { tabId: "tab-2", webContentsId: 102 },
        { tabId: "tab-2", webContentsId: 103 },
        { tabId: "", webContentsId: 104 },
        { tabId: "tab-5", webContentsId: 0 },
        null,
      ],
    });

    expect(bindings).toEqual([
      { tabId: "tab-1", webContentsId: 101 },
      { tabId: "tab-2", webContentsId: 102 },
    ]);
  });
});

describe("matchesBrowserCaptureStatusGroup", () => {
  it("groups pending, status buckets, and error requests", () => {
    expect(matchesBrowserCaptureStatusGroup(null, null, "pending")).toBe(true);
    expect(matchesBrowserCaptureStatusGroup(204, null, "2xx")).toBe(true);
    expect(matchesBrowserCaptureStatusGroup(302, null, "3xx")).toBe(true);
    expect(matchesBrowserCaptureStatusGroup(404, null, "error")).toBe(true);
    expect(
      matchesBrowserCaptureStatusGroup(null, "net::ERR_FAILED", "error")
    ).toBe(true);
    expect(matchesBrowserCaptureStatusGroup(200, null, "error")).toBe(false);
    expect(matchesBrowserCaptureStatusGroup(500, null, "2xx")).toBe(false);
  });
});

function makeCaptureRequest(
  overrides: Partial<BrowserCaptureRequestDetail> &
    Pick<BrowserCaptureRequestDetail, "id" | "seq" | "method" | "url">
): BrowserCaptureRequestDetail {
  return {
    contentType: "application/json",
    durationMs: 20,
    errorText: null,
    hasRequestBody: false,
    hasResponseBody: false,
    requestBody: null,
    requestBodyTruncated: false,
    requestHeaders: {},
    resourceType: "xhr",
    responseBody: null,
    responseBodyOmittedReason: null,
    responseBodyTruncated: false,
    responseHeaders: {},
    source: "browser",
    startedAt: 1000,
    status: 200,
    tabId: "tab-1",
    ...overrides,
  };
}

describe("filterBrowserCaptureRequestDetails", () => {
  const requests = [
    makeCaptureRequest({
      id: "req-1",
      method: "GET",
      seq: 1,
      url: "https://api.test.dev/users",
    }),
    makeCaptureRequest({
      id: "req-2",
      method: "POST",
      seq: 2,
      status: 500,
      url: "https://api.test.dev/orders",
    }),
    makeCaptureRequest({
      contentType: "image/png",
      id: "req-3",
      method: "GET",
      resourceType: "image",
      seq: 3,
      status: null,
      url: "https://static.test.dev/logo.png",
    }),
    makeCaptureRequest({
      errorText: "net::ERR_FAILED",
      id: "req-4",
      method: "HEAD",
      resourceType: "websocket",
      seq: 4,
      status: null,
      url: "https://api.test.dev/session",
    }),
  ];

  it("filters by explicit request ids before applying status and text filters", () => {
    expect(
      filterBrowserCaptureRequestDetails(requests, {
        query: "orders",
        requestIds: ["req-1", "req-2", "missing"],
        statusGroup: "5xx",
      }).map((request) => request.id)
    ).toEqual(["req-2"]);
  });

  it("keeps pending and failed requests in their expected groups", () => {
    expect(
      filterBrowserCaptureRequestDetails(requests, {
        statusGroup: "pending",
      }).map((request) => request.id)
    ).toEqual(["req-3", "req-4"]);
    expect(
      filterBrowserCaptureRequestDetails(requests, {
        statusGroup: "error",
      }).map((request) => request.id)
    ).toEqual(["req-2", "req-4"]);
  });

  it("filters by method and resource type", () => {
    expect(
      filterBrowserCaptureRequestDetails(requests, { method: "POST" }).map(
        (request) => request.id
      )
    ).toEqual(["req-2"]);
    expect(
      filterBrowserCaptureRequestDetails(requests, {
        method: "OTHER",
        resourceType: "other",
      }).map((request) => request.id)
    ).toEqual(["req-4"]);
    expect(
      filterBrowserCaptureRequestDetails(requests, {
        resourceType: "image",
      }).map((request) => request.id)
    ).toEqual(["req-3"]);
  });

  it("filters by capture source", () => {
    const mixed = [
      makeCaptureRequest({
        id: "req-browser",
        method: "GET",
        seq: 1,
        url: "https://app.test.dev",
      }),
      makeCaptureRequest({
        id: "req-proxy",
        method: "POST",
        seq: 2,
        source: "proxy",
        tabId: "external-device",
        url: "https://phone.test.dev/api",
      }),
    ];

    expect(
      filterBrowserCaptureRequestDetails(mixed, { source: "proxy" }).map(
        (request) => request.id
      )
    ).toEqual(["req-proxy"]);
    expect(
      filterBrowserCaptureRequestDetails(mixed, { query: "proxy" }).map(
        (request) => request.id
      )
    ).toEqual(["req-proxy"]);
  });
});

describe("addBrowserCaptureExternalRequestForHostId", () => {
  it("adds proxy sourced requests only while capture is active", async () => {
    const hostId = 930_001;

    expect(
      addBrowserCaptureExternalRequestForHostId(hostId, {
        method: "GET",
        url: "https://phone.test.dev/ignored",
      })
    ).toBeNull();

    await startBrowserCaptureForHostId(hostId, { clear: true });
    const added = addBrowserCaptureExternalRequestForHostId(hostId, {
      durationMs: 24,
      method: "POST",
      requestBody: '{"ok":true}',
      requestHeaders: { "content-type": "application/json" },
      responseBody: '{"id":1}',
      responseHeaders: { "content-type": "application/json" },
      status: 201,
      url: "https://phone.test.dev/api",
    });

    expect(added?.source).toBe("proxy");
    expect(added?.tabId).toBe("external-device");
    expect(added?.requestBody).toBe('{"ok":true}');
    expect(
      listBrowserCaptureRequestsForHostId(hostId, { source: "proxy" }).items
    ).toHaveLength(1);

    await stopBrowserCaptureForHostId(hostId);
    clearBrowserCaptureDataForHostId(hostId);
  });
});
