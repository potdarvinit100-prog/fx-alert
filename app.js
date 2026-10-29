"use strict";

// Live currency conversion + rate alerts from Frankfurter (ECB rates).
// No API key. Frankfurter's ECB-based list does not include AED, so this
// app covers USD, EUR, GBP and INR only — verified against the live API.
const API_URL = "https://api.frankfurter.dev/v1/latest?from=USD&to=INR,EUR,GBP";
const STORAGE_KEY = "fx-alert-alerts";

const statusEl = document.getElementById("status");
const errorEl = document.getElementById("error");
const alertsEl = document.getElementById("alerts");
const resultEl = document.getElementById("result");
const ratesEl = document.getElementById("rates");
const alertListEl = document.getElementById("alertList");
const sourceLineEl = document.getElementById("sourceLine");

let rates = null; // units of each currency per 1 USD
let ratesDate = "";

function loadAlerts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function saveAlerts(alerts) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts)); } catch (err) { /* storage unavailable */ }
}

function pairRate(from, to) {
  if (from === to) return 1;
  return rates[to] / rates[from];
}

function formatRate(value) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

function renderAlertList() {
  const alerts = loadAlerts();
  alertListEl.textContent = "";
  if (alerts.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No alerts set yet.";
    alertListEl.appendChild(item);
    return;
  }
  alerts.forEach((alert, index) => {
    const item = document.createElement("li");
    item.textContent = "1 " + alert.from + " in " + alert.to + " " + alert.direction +
      " " + formatRate(alert.target) + (alert.triggered ? " — TRIGGERED" : "");
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      const current = loadAlerts();
      current.splice(index, 1);
      saveAlerts(current);
      renderAlertList();
    });
    item.appendChild(remove);
    alertListEl.appendChild(item);
  });
}

function convert() {
  if (!rates) return;
  const amount = parseFloat(document.getElementById("amount").value);
  const from = document.getElementById("fromCur").value;
  const to = document.getElementById("toCur").value;
  if (!Number.isFinite(amount) || amount < 0) {
    resultEl.textContent = "Enter an amount of 0 or more.";
    return;
  }
  const converted = amount * pairRate(from, to);
  resultEl.textContent = amount.toLocaleString("en-US") + " " + from + " = " +
    converted.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " " + to;
}

function checkAlerts() {
  const alerts = loadAlerts();
  let changed = false;
  const fired = [];
  for (const alert of alerts) {
    if (alert.triggered) continue;
    const current = pairRate(alert.from, alert.to);
    const crossed = alert.direction === "above"
      ? current >= alert.target
      : current <= alert.target;
    if (crossed) {
      alert.triggered = true;
      changed = true;
      fired.push({ alert, current });
    }
  }
  if (changed) saveAlerts(alerts);
  if (fired.length > 0) {
    alertsEl.hidden = false;
    alertsEl.textContent = "Rate alert: " + fired.map((f) =>
      "1 " + f.alert.from + " now buys " + formatRate(f.current) + " " + f.alert.to +
      " (" + f.alert.direction + " " + formatRate(f.alert.target) + ")"
    ).join(" · ");
  }
  renderAlertList();
}

async function load() {
  statusEl.textContent = "Loading live data…";
  errorEl.hidden = true;
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("API returned HTTP " + res.status);
    const data = await res.json();
    if (!data.rates || typeof data.rates.INR !== "number") {
      throw new Error("Unexpected API response");
    }
    rates = { USD: 1, ...data.rates };
    ratesDate = data.date;
    ratesEl.textContent = "Reference rates per 1 USD (" + ratesDate + "): 1 USD = " +
      formatRate(rates.INR) + " INR · " + formatRate(rates.EUR) + " EUR · " +
      formatRate(rates.GBP) + " GBP.";
    convert();
    checkAlerts();
    statusEl.textContent = "Live data loaded.";
    sourceLineEl.textContent =
      "Source: Frankfurter API (ECB reference rates), rates dated " + ratesDate +
      ". Page last updated: " + new Date().toLocaleString() + ".";
  } catch (err) {
    errorEl.hidden = false;
    errorEl.textContent = "Could not load live rates from Frankfurter (" + err.message +
      "). No conversion is shown rather than old or invented rates. Check your connection and try Refresh.";
    statusEl.textContent = "Live data unavailable.";
  }
}

document.getElementById("convert").addEventListener("click", convert);
document.getElementById("amount").addEventListener("input", convert);
document.getElementById("fromCur").addEventListener("change", convert);
document.getElementById("toCur").addEventListener("change", convert);
document.getElementById("refresh").addEventListener("click", load);
document.getElementById("clearAlerts").addEventListener("click", () => {
  const alerts = loadAlerts().map((a) => ({ ...a, triggered: false }));
  saveAlerts(alerts);
  alertsEl.hidden = true;
  renderAlertList();
});
document.getElementById("setAlert").addEventListener("click", () => {
  const from = document.getElementById("alertFrom").value;
  const to = document.getElementById("alertTo").value;
  const direction = document.getElementById("alertDirection").value;
  const target = parseFloat(document.getElementById("alertTarget").value);
  if (from === to) {
    alert("Pick two different currencies for a rate alert.");
    return;
  }
  if (!Number.isFinite(target) || target <= 0) {
    alert("Enter a target rate above 0.");
    return;
  }
  const alerts = loadAlerts();
  alerts.push({ from, to, direction, target, triggered: false });
  saveAlerts(alerts);
  renderAlertList();
  document.getElementById("alertTarget").value = "";
});

renderAlertList();
load();
setInterval(load, 10 * 60 * 1000);
