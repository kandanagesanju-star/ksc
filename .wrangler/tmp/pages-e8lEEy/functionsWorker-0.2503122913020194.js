var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/admin.ts
var DEFAULT_ADMIN_KEY = "KSC-SaaS-Admin-2026";
var checkAuth = /* @__PURE__ */ __name(async (request, env) => {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.substring(7).trim();
  let expectedKey = env.ADMIN_KEY || DEFAULT_ADMIN_KEY;
  if (env.SYNC_KV) {
    const customKey = await env.SYNC_KV.get("saas_admin_master_key");
    if (customKey) {
      expectedKey = customKey;
    }
  }
  return token === expectedKey;
}, "checkAuth");
var onRequestGet = /* @__PURE__ */ __name(async (context) => {
  const { env, request } = context;
  const isAuth = await checkAuth(request, env);
  if (!isAuth) {
    return new Response(JSON.stringify({ error: "Unauthorized Super Admin access" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  let registry = [];
  let isPrivate = false;
  if (env.SYNC_KV) {
    isPrivate = true;
    const registryData = await env.SYNC_KV.get("saas_shops_registry");
    if (registryData) {
      registry = JSON.parse(registryData);
    }
  } else {
    registry = [
      {
        shopId: "ksc-demo",
        shopName: "Demo Mobile & Groceries (Mock)",
        createdAt: Date.now() - 864e5 * 5,
        lastSynced: Date.now() - 36e5,
        productsCount: 42,
        salesCount: 120,
        status: "active"
      },
      {
        shopId: "suspended-shop",
        shopName: "Suspended Boutique (Mock)",
        createdAt: Date.now() - 864e5 * 10,
        lastSynced: Date.now() - 864e5 * 2,
        productsCount: 15,
        salesCount: 4,
        status: "deactivated"
      }
    ];
  }
  return new Response(JSON.stringify({ registry, isPrivate }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}, "onRequestGet");
var onRequestPost = /* @__PURE__ */ __name(async (context) => {
  const { env, request } = context;
  const isAuth = await checkAuth(request, env);
  if (!isAuth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  try {
    const bodyText = await request.text();
    const payload = JSON.parse(bodyText);
    const { action } = payload;
    if (action === "toggle_status") {
      const { shopId, status } = payload;
      if (!shopId || !status || !["active", "deactivated"].includes(status)) {
        throw new Error("Invalid shopId or status parameters");
      }
      if (env.SYNC_KV) {
        await env.SYNC_KV.put(`status_${shopId}`, status);
        const registryData = await env.SYNC_KV.get("saas_shops_registry");
        let registry = registryData ? JSON.parse(registryData) : [];
        const index = registry.findIndex((item) => item.shopId === shopId);
        if (index > -1) {
          registry[index].status = status;
          await env.SYNC_KV.put("saas_shops_registry", JSON.stringify(registry));
        }
      }
      return new Response(JSON.stringify({ success: true, shopId, status }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    if (action === "create_shop") {
      const { shopName, email, phone, password, expiryDate } = payload;
      if (!shopName || shopName.trim() === "") {
        throw new Error("Shop name is required");
      }
      const cleanName = shopName.trim();
      const shopId = "ksc-" + Math.floor(1e3 + Math.random() * 9e3);
      if (env.SYNC_KV) {
        const defaultState = {
          products: [],
          customers: [],
          suppliers: [],
          repairs: [],
          sales: [],
          employees: [],
          attendance: [],
          commissions: [],
          specialOrders: [],
          expenses: [],
          stockAdjustments: [],
          stockReturns: [],
          quotations: [],
          settings: {
            shopName: cleanName,
            shopAddress: "Address Pending",
            shopPhone: phone || "Phone Pending",
            shopEmail: email || "",
            shopLogoUrl: "",
            taxRegistrationNo: "",
            receiptFooterMessage: "Thank you for shopping with us!",
            loyaltyPointValue: 1,
            pointRedemptionValue: 1,
            posShortcuts: {
              completeSale: "F8",
              clearCart: "F9",
              addCustomer: "F7",
              focusSearch: "F2"
            },
            receiptWidth: "80mm",
            vatRate: 0,
            ssclRate: 0,
            onlineStoreName: cleanName,
            onlineStoreLogoUrl: "",
            onlineHeaderBgColor: "bg-slate-900",
            onlineHeroBannerUrl: "",
            onlinePrimaryThemeColor: "bg-blue-600",
            uiTheme: "slate"
          },
          lastUpdated: Date.now()
        };
        await env.SYNC_KV.put(`shop_${shopId}`, JSON.stringify(defaultState));
        await env.SYNC_KV.put(`status_${shopId}`, "active");
        if (password && password.trim() !== "") {
          await env.SYNC_KV.put(`password_${shopId}`, password.trim());
        }
        if (expiryDate) {
          await env.SYNC_KV.put(`expiry_${shopId}`, String(expiryDate));
        }
        const registryData = await env.SYNC_KV.get("saas_shops_registry");
        let registry = registryData ? JSON.parse(registryData) : [];
        registry.push({
          shopId,
          shopName: cleanName,
          createdAt: Date.now(),
          lastSynced: Date.now(),
          productsCount: 0,
          salesCount: 0,
          status: "active",
          email: email || "",
          phone: phone || "",
          password: password || "",
          expiryDate: expiryDate ? Number(expiryDate) : 0
        });
        await env.SYNC_KV.put("saas_shops_registry", JSON.stringify(registry));
      }
      return new Response(JSON.stringify({ success: true, shopId, shopName: cleanName, email, phone, password, expiryDate: expiryDate ? Number(expiryDate) : 0 }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    if (action === "edit_shop") {
      const { shopId, shopName, email, phone, password, expiryDate } = payload;
      if (!shopId) {
        throw new Error("Shop ID is required");
      }
      if (env.SYNC_KV) {
        const registryData = await env.SYNC_KV.get("saas_shops_registry");
        let registry = registryData ? JSON.parse(registryData) : [];
        const index = registry.findIndex((item) => item.shopId === shopId);
        if (index > -1) {
          registry[index] = {
            ...registry[index],
            shopName: shopName ? shopName.trim() : registry[index].shopName,
            email: email !== void 0 ? email.trim() : registry[index].email,
            phone: phone !== void 0 ? phone.trim() : registry[index].phone,
            password: password !== void 0 ? password.trim() : registry[index].password,
            expiryDate: expiryDate !== void 0 ? Number(expiryDate) : registry[index].expiryDate
          };
          await env.SYNC_KV.put("saas_shops_registry", JSON.stringify(registry));
        }
        if (password !== void 0) {
          if (password.trim() === "") {
            await env.SYNC_KV.delete(`password_${shopId}`);
          } else {
            await env.SYNC_KV.put(`password_${shopId}`, password.trim());
          }
        }
        if (expiryDate !== void 0) {
          if (!expiryDate) {
            await env.SYNC_KV.delete(`expiry_${shopId}`);
          } else {
            await env.SYNC_KV.put(`expiry_${shopId}`, String(expiryDate));
          }
        }
      }
      return new Response(JSON.stringify({ success: true, shopId }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    if (action === "delete_shop") {
      const { shopId } = payload;
      if (!shopId) {
        throw new Error("Shop ID is required");
      }
      if (env.SYNC_KV) {
        const registryData = await env.SYNC_KV.get("saas_shops_registry");
        let registry = registryData ? JSON.parse(registryData) : [];
        const updatedRegistry = registry.filter((item) => item.shopId !== shopId);
        await env.SYNC_KV.put("saas_shops_registry", JSON.stringify(updatedRegistry));
        await env.SYNC_KV.delete(`shop_${shopId}`);
        await env.SYNC_KV.delete(`status_${shopId}`);
        await env.SYNC_KV.delete(`password_${shopId}`);
        await env.SYNC_KV.delete(`expiry_${shopId}`);
      }
      return new Response(JSON.stringify({ success: true, shopId }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    if (action === "change_admin_key") {
      const { newKey } = payload;
      if (!newKey || newKey.trim().length < 4) {
        throw new Error("Key must be at least 4 characters long");
      }
      if (env.SYNC_KV) {
        await env.SYNC_KV.put("saas_admin_master_key", newKey.trim());
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    throw new Error("Unknown admin action: " + action);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}, "onRequestPost");
var onRequestOptions = /* @__PURE__ */ __name(async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400"
    }
  });
}, "onRequestOptions");

// api/sync.ts
var onRequestGet2 = /* @__PURE__ */ __name(async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const shopId = url.searchParams.get("shopId");
  const timestampOnly = url.searchParams.get("timestampOnly") === "true";
  if (!shopId || shopId === "undefined" || shopId === "null") {
    return new Response(JSON.stringify({ found: false, error: "Missing shopId", isPrivate: !!env.SYNC_KV }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  let data = null;
  let isPrivate = false;
  let daysRemaining = 9999;
  let expiryDateVal = 0;
  let isExpired = false;
  if (env.SYNC_KV) {
    isPrivate = true;
    const expiryStr = await env.SYNC_KV.get(`expiry_${shopId}`);
    if (expiryStr) {
      expiryDateVal = Number(expiryStr);
      const diff = expiryDateVal - Date.now();
      daysRemaining = Math.ceil(diff / (1e3 * 60 * 60 * 24));
      if (daysRemaining <= 0) {
        isExpired = true;
      }
    }
    const status = await env.SYNC_KV.get(`status_${shopId}`) || "active";
    if (status === "deactivated" || isExpired) {
      return new Response(JSON.stringify({
        found: true,
        suspended: true,
        reason: isExpired ? "Expired" : "Suspended",
        isPrivate
      }), {
        status: 200,
        // Return 200 so UI initialization fetches the status check gracefully
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    const password = request.headers.get("X-Shop-Password") || "";
    const expectedPassword = await env.SYNC_KV.get(`password_${shopId}`);
    if (expectedPassword && password !== expectedPassword) {
      return new Response(JSON.stringify({ error: "Invalid Shop Password", authorized: false, isPrivate }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    data = await env.SYNC_KV.get(`shop_${shopId}`);
  } else {
    if (shopId.startsWith("suspended-")) {
      return new Response(JSON.stringify({ found: true, suspended: true, isPrivate: false }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    try {
      const res = await fetch(`https://extendsclass.com/api/json-storage/bin/${shopId}`);
      if (res.ok) {
        data = await res.text();
      }
    } catch (err) {
      console.error("ExtendsClass GET error:", err);
    }
  }
  if (!data) {
    return new Response(JSON.stringify({ found: false, isPrivate, daysRemaining, expiryDate: expiryDateVal }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  try {
    const parsed = JSON.parse(data);
    if (timestampOnly) {
      const dataSize = parsed.dataSize !== void 0 ? parsed.dataSize : data.length;
      const productsCount = parsed.productsCount !== void 0 ? parsed.productsCount : parsed.products?.length || 0;
      const salesCount = parsed.salesCount !== void 0 ? parsed.salesCount : parsed.sales?.length || 0;
      return new Response(JSON.stringify({
        found: true,
        lastUpdated: parsed.lastUpdated || 0,
        isPrivate,
        dataSize,
        productsCount,
        salesCount,
        daysRemaining,
        expiryDate: expiryDateVal
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    if (typeof parsed === "object" && parsed !== null) {
      parsed.isPrivate = isPrivate;
      parsed.found = true;
      parsed.daysRemaining = daysRemaining;
      parsed.expiryDate = expiryDateVal;
    }
    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON stored", isPrivate, daysRemaining, expiryDate: expiryDateVal }), {
      status: 200,
      // Return 200 so frontend doesn't crash on invalid data, just treats it as not found
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}, "onRequestGet");
var onRequestPost2 = /* @__PURE__ */ __name(async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const shopId = url.searchParams.get("shopId");
  const createBin = url.searchParams.get("createBin") === "true";
  try {
    const body = await request.text();
    const parsedData = JSON.parse(body);
    let isPrivate = false;
    let finalShopId = shopId;
    if (env.SYNC_KV) {
      isPrivate = true;
      if (createBin || !finalShopId || finalShopId === "undefined" || finalShopId === "null") {
        finalShopId = "ksc-" + Math.floor(1e3 + Math.random() * 9e3);
      }
      const expiryStr = await env.SYNC_KV.get(`expiry_${finalShopId}`);
      let isExpired = false;
      if (expiryStr) {
        const expiry = Number(expiryStr);
        if (expiry - Date.now() <= 0) {
          isExpired = true;
        }
      }
      const status = await env.SYNC_KV.get(`status_${finalShopId}`) || "active";
      if (status === "deactivated" || isExpired) {
        return new Response(JSON.stringify({
          error: isExpired ? "Subscription Expired. Sync Blocked." : "Account Suspended. Sync Blocked.",
          suspended: true,
          reason: isExpired ? "Expired" : "Suspended"
        }), {
          status: 403,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
      if (!createBin && finalShopId && finalShopId !== "undefined" && finalShopId !== "null") {
        const password = request.headers.get("X-Shop-Password") || "";
        const expectedPassword = await env.SYNC_KV.get(`password_${finalShopId}`);
        if (expectedPassword && password !== expectedPassword) {
          return new Response(JSON.stringify({ error: "Invalid Shop Password", authorized: false, isPrivate }), {
            status: 401,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }
      }
      await env.SYNC_KV.put(`shop_${finalShopId}`, body);
      try {
        const registryData = await env.SYNC_KV.get("saas_shops_registry");
        let registry = registryData ? JSON.parse(registryData) : [];
        const shopName = parsedData.settings?.shopName || "Unnamed Shop";
        const productsCount = parsedData.products?.length || 0;
        const salesCount = parsedData.sales?.length || 0;
        const lastUpdated = parsedData.lastUpdated || Date.now();
        const adminPin = parsedData.settings?.adminPin;
        if (adminPin && adminPin.trim() !== "") {
          const currentExpected = await env.SYNC_KV.get(`password_${finalShopId}`);
          if (adminPin.trim() !== currentExpected) {
            await env.SYNC_KV.put(`password_${finalShopId}`, adminPin.trim());
          }
        }
        const existingIndex = registry.findIndex((item) => item.shopId === finalShopId);
        if (existingIndex > -1) {
          registry[existingIndex] = {
            ...registry[existingIndex],
            shopName,
            productsCount,
            salesCount,
            lastSynced: lastUpdated,
            password: adminPin ? adminPin.trim() : registry[existingIndex].password
          };
        } else {
          registry.push({
            shopId: finalShopId,
            shopName,
            createdAt: Date.now(),
            lastSynced: lastUpdated,
            productsCount,
            salesCount,
            status: "active",
            password: adminPin ? adminPin.trim() : "8892"
          });
        }
        await env.SYNC_KV.put("saas_shops_registry", JSON.stringify(registry));
      } catch (regErr) {
        console.error("Error updating saas_shops_registry:", regErr);
      }
    } else {
      if (finalShopId && finalShopId.startsWith("suspended-")) {
        return new Response(JSON.stringify({ error: "Account Suspended. Sync Blocked.", suspended: true }), {
          status: 403,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
      if (createBin || !finalShopId || finalShopId === "undefined" || finalShopId === "null") {
        const res = await fetch("https://extendsclass.com/api/json-storage/bin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body
        });
        if (!res.ok) {
          throw new Error(`ExtendsClass create failed: ${res.statusText}`);
        }
        const resData = await res.json();
        finalShopId = resData.id;
      } else {
        const res = await fetch(`https://extendsclass.com/api/json-storage/bin/${finalShopId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body
        });
        if (!res.ok) {
          throw new Error(`ExtendsClass update failed: ${res.statusText}`);
        }
      }
    }
    return new Response(JSON.stringify({
      success: true,
      shopId: finalShopId,
      isPrivate,
      updatedPassword: parsedData.settings?.adminPin
    }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}, "onRequestPost");
var onRequestOptions2 = /* @__PURE__ */ __name(async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    }
  });
}, "onRequestOptions");

// ../.wrangler/tmp/pages-e8lEEy/functionsRoutes-0.18451745790288254.mjs
var routes = [
  {
    routePath: "/api/admin",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/admin",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions]
  },
  {
    routePath: "/api/admin",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/sync",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/sync",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions2]
  },
  {
    routePath: "/api/sync",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  }
];

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
