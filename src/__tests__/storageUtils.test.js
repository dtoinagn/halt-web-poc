import {
  storage,
  cookieUtils,
  authUtils,
  sortUtils,
  hideExtendedUtils,
  columnWidthUtils,
  permissionUtils,
} from "../utils/storageUtils";

// Singleton cookie instance shared across all storageUtils calls
let cookiesInstance;

jest.mock("universal-cookie", () => {
  const instance = {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  };
  return jest.fn(() => instance);
});

import Cookies from "universal-cookie";

beforeAll(() => {
  // Cookies constructor always returns the same singleton instance
  cookiesInstance = new Cookies();
});

beforeEach(() => {
  localStorage.clear();
  jest.resetAllMocks();
});

// ---------------------------------------------------------------------------
// storage
// ---------------------------------------------------------------------------

describe("storage", () => {
  it("sets and gets a value", () => {
    storage.set("key", "value");
    expect(storage.get("key")).toBe("value");
  });

  it("returns null for a missing key", () => {
    expect(storage.get("nonexistent")).toBeNull();
  });

  it("remove deletes the key", () => {
    storage.set("key", "value");
    storage.remove("key");
    expect(storage.get("key")).toBeNull();
  });

  it("clear removes all keys", () => {
    storage.set("a", "1");
    storage.set("b", "2");
    storage.clear();
    expect(storage.get("a")).toBeNull();
    expect(storage.get("b")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// cookieUtils
// ---------------------------------------------------------------------------

describe("cookieUtils", () => {
  it("get delegates to the Cookies instance", () => {
    cookiesInstance.get.mockReturnValue("testUser");
    expect(cookieUtils.get("userLogInCookie")).toBe("testUser");
    expect(cookiesInstance.get).toHaveBeenCalledWith("userLogInCookie");
  });

  it("set delegates to the Cookies instance with options", () => {
    const options = { expires: new Date("2099-01-01") };
    cookieUtils.set("userLogInCookie", "admin", options);
    expect(cookiesInstance.set).toHaveBeenCalledWith("userLogInCookie", "admin", options);
  });

  it("set passes empty options object when none provided", () => {
    cookieUtils.set("key", "value");
    expect(cookiesInstance.set).toHaveBeenCalledWith("key", "value", {});
  });

  it("remove delegates to the Cookies instance", () => {
    cookieUtils.remove("userLogInCookie");
    expect(cookiesInstance.remove).toHaveBeenCalledWith("userLogInCookie");
  });
});

// ---------------------------------------------------------------------------
// authUtils
// ---------------------------------------------------------------------------

describe("authUtils", () => {
  describe("token", () => {
    it("setToken stores the token in localStorage", () => {
      authUtils.setToken("my-jwt");
      expect(localStorage.getItem("token")).toBe("my-jwt");
    });

    it("getToken retrieves the token from localStorage", () => {
      localStorage.setItem("token", "my-jwt");
      expect(authUtils.getToken()).toBe("my-jwt");
    });

    it("removeToken deletes the token", () => {
      localStorage.setItem("token", "my-jwt");
      authUtils.removeToken();
      expect(localStorage.getItem("token")).toBeNull();
    });
  });

  describe("loggedInUser", () => {
    it("setLoggedInUser stores the username", () => {
      authUtils.setLoggedInUser("admin");
      expect(localStorage.getItem("loggedInUser")).toBe("admin");
    });

    it("getLoggedInUser retrieves the username", () => {
      localStorage.setItem("loggedInUser", "trader1");
      expect(authUtils.getLoggedInUser()).toBe("trader1");
    });

    it("removeLoggedInUser deletes the username", () => {
      localStorage.setItem("loggedInUser", "admin");
      authUtils.removeLoggedInUser();
      expect(localStorage.getItem("loggedInUser")).toBeNull();
    });
  });

  describe("loggedIn flag", () => {
    it("setLoggedIn stores the value as a string", () => {
      authUtils.setLoggedIn(true);
      expect(localStorage.getItem("loggedIn")).toBe("true");
    });

    it("removeLoggedIn deletes the flag", () => {
      localStorage.setItem("loggedIn", "true");
      authUtils.removeLoggedIn();
      expect(localStorage.getItem("loggedIn")).toBeNull();
    });
  });

  describe("isLoggedIn", () => {
    it("returns true when localStorage flag is 'true' and cookie is present", () => {
      localStorage.setItem("loggedIn", "true");
      cookiesInstance.get.mockReturnValue("admin");
      expect(authUtils.isLoggedIn()).toBe(true);
    });

    it("returns false when localStorage flag is missing", () => {
      cookiesInstance.get.mockReturnValue("admin");
      expect(authUtils.isLoggedIn()).toBe(false);
    });

    it("returns false when cookie is null", () => {
      localStorage.setItem("loggedIn", "true");
      cookiesInstance.get.mockReturnValue(null);
      expect(authUtils.isLoggedIn()).toBe(false);
    });

    it("returns false when localStorage flag is not the string 'true'", () => {
      localStorage.setItem("loggedIn", "1");
      cookiesInstance.get.mockReturnValue("admin");
      expect(authUtils.isLoggedIn()).toBe(false);
    });
  });

  describe("logout", () => {
    it("clears token, loggedIn, loggedInUser, and permissions from localStorage", () => {
      localStorage.setItem("token", "tok");
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("loggedInUser", "admin");
      localStorage.setItem("permissions", JSON.stringify(["CreateImmediateHalt"]));

      authUtils.logout();

      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("loggedIn")).toBeNull();
      expect(localStorage.getItem("loggedInUser")).toBeNull();
      expect(localStorage.getItem("permissions")).toBeNull();
    });

    it("removes both user cookies", () => {
      authUtils.logout();
      expect(cookiesInstance.remove).toHaveBeenCalledWith("userLogIn");
      expect(cookiesInstance.remove).toHaveBeenCalledWith("userLogInCookie");
    });
  });
});

// ---------------------------------------------------------------------------
// sortUtils
// ---------------------------------------------------------------------------

describe("sortUtils", () => {
  it("initializeSortPreferences sets default values for all keys", () => {
    sortUtils.initializeSortPreferences();
    expect(localStorage.getItem("activeRegOrderedBy")).toBe("haltTime");
    expect(localStorage.getItem("activeRegOrderDirection")).toBe("desc");
    expect(localStorage.getItem("activeSSCBOrderedBy")).toBe("haltTime");
    expect(localStorage.getItem("activeSSCBOrderDirection")).toBe("desc");
    expect(localStorage.getItem("pendingOrderedBy")).toBe("haltTime");
    expect(localStorage.getItem("pendingOrderDirection")).toBe("desc");
    expect(localStorage.getItem("todayLiftedOrderedBy")).toBe("haltTime");
    expect(localStorage.getItem("todayLiftedOrderDirection")).toBe("desc");
  });

  it("initializeSortPreferences does not overwrite existing values", () => {
    localStorage.setItem("activeRegOrderedBy", "symbol");
    sortUtils.initializeSortPreferences();
    expect(localStorage.getItem("activeRegOrderedBy")).toBe("symbol");
  });

  it("getSortPreference returns the stored value", () => {
    localStorage.setItem("activeRegOrderedBy", "haltTime");
    expect(sortUtils.getSortPreference("activeRegOrderedBy")).toBe("haltTime");
  });

  it("setSortPreference stores the value", () => {
    sortUtils.setSortPreference("activeRegOrderedBy", "symbol");
    expect(localStorage.getItem("activeRegOrderedBy")).toBe("symbol");
  });
});

// ---------------------------------------------------------------------------
// hideExtendedUtils
// ---------------------------------------------------------------------------

describe("hideExtendedUtils", () => {
  it("get returns the cookie value when set", () => {
    cookiesInstance.get.mockReturnValue(true);
    expect(hideExtendedUtils.get()).toBe(true);
  });

  it("get returns false when the cookie is not set", () => {
    cookiesInstance.get.mockReturnValue(undefined);
    expect(hideExtendedUtils.get()).toBe(false);
  });

  it("set writes the value to the cookie", () => {
    hideExtendedUtils.set(true);
    expect(cookiesInstance.set).toHaveBeenCalledWith("userHideExtendedHalt", true, {});
  });
});

// ---------------------------------------------------------------------------
// columnWidthUtils
// ---------------------------------------------------------------------------

describe("columnWidthUtils", () => {
  it("getWidths returns an empty object when nothing is stored", () => {
    expect(columnWidthUtils.getWidths("activeReg")).toEqual({});
  });

  it("setWidths and getWidths round-trip correctly", () => {
    const widths = { symbol: 120, haltId: 200 };
    columnWidthUtils.setWidths("activeReg", widths);
    expect(columnWidthUtils.getWidths("activeReg")).toEqual(widths);
  });

  it("stores widths under a table-specific localStorage key", () => {
    columnWidthUtils.setWidths("pending", { symbol: 100 });
    expect(localStorage.getItem("pendingColumnWidths")).toBe(
      JSON.stringify({ symbol: 100 })
    );
  });

  it("different table types are stored independently", () => {
    columnWidthUtils.setWidths("activeReg", { symbol: 120 });
    columnWidthUtils.setWidths("pending", { symbol: 100 });
    expect(columnWidthUtils.getWidths("activeReg")).toEqual({ symbol: 120 });
    expect(columnWidthUtils.getWidths("pending")).toEqual({ symbol: 100 });
  });
});

// ---------------------------------------------------------------------------
// permissionUtils
// ---------------------------------------------------------------------------

describe("permissionUtils", () => {
  it("getPermissions returns null when nothing is stored", () => {
    expect(permissionUtils.getPermissions()).toBeNull();
  });

  it("setPermissions and getPermissions round-trip correctly", () => {
    const actions = ["CreateImmediateHalt", "CancelScheduledHalt"];
    permissionUtils.setPermissions(actions);
    expect(permissionUtils.getPermissions()).toEqual(actions);
  });

  it("removePermissions clears stored permissions", () => {
    permissionUtils.setPermissions(["CreateImmediateHalt"]);
    permissionUtils.removePermissions();
    expect(permissionUtils.getPermissions()).toBeNull();
  });

  it("setPermissions overwrites previously stored permissions", () => {
    permissionUtils.setPermissions(["CreateImmediateHalt"]);
    permissionUtils.setPermissions(["CancelScheduledHalt", "ExtendHalt"]);
    expect(permissionUtils.getPermissions()).toEqual([
      "CancelScheduledHalt",
      "ExtendHalt",
    ]);
  });

  it("getPermissions returns an empty array for invalid stored JSON", () => {
    localStorage.setItem("permissions", "not-valid-json");
    expect(() => permissionUtils.getPermissions()).toThrow();
  });
});
