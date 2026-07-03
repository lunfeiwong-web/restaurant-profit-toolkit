const fields = {
  restaurantName: document.querySelector("#restaurantName"),
  reportMonth: document.querySelector("#reportMonth"),
  referenceCurrency: document.querySelector("#referenceCurrency"),
  exchangeRate: document.querySelector("#exchangeRate"),
  dineInSales: document.querySelector("#dineInSales"),
  takeawaySales: document.querySelector("#takeawaySales"),
  deliverySales: document.querySelector("#deliverySales"),
  otherSales: document.querySelector("#otherSales"),
  foodCost: document.querySelector("#foodCost"),
  laborCost: document.querySelector("#laborCost"),
  rentCost: document.querySelector("#rentCost"),
  utilityCost: document.querySelector("#utilityCost"),
  platformFees: document.querySelector("#platformFees"),
  marketingCost: document.querySelector("#marketingCost"),
  maintenanceCost: document.querySelector("#maintenanceCost"),
  otherCost: document.querySelector("#otherCost"),
  itemName: document.querySelector("#itemName"),
  itemPrice: document.querySelector("#itemPrice"),
  itemIngredientCost: document.querySelector("#itemIngredientCost"),
  itemPackagingCost: document.querySelector("#itemPackagingCost"),
  itemOtherCost: document.querySelector("#itemOtherCost"),
  commissionRate: document.querySelector("#commissionRate"),
  targetMargin: document.querySelector("#targetMargin"),
  priceEnding: document.querySelector("#priceEnding")
};

const money = new Intl.NumberFormat("en-MY", {
  currency: "MYR",
  style: "currency"
});

const usd = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency"
});

let ingredientRows = [];
let ingredientId = 0;

function value(id) {
  const number = Number(fields[id]?.value || 0);
  return Number.isFinite(number) ? number : 0;
}

function rate() {
  const rawRate = value("exchangeRate");
  return rawRate > 0 ? rawRate : 1;
}

function formatMoney(amount) {
  return money.format(amount);
}

function formatUsd(amount) {
  const code = fields.referenceCurrency?.value || "USD";
  const converted = amount / rate();
  try {
    return new Intl.NumberFormat("en-US", {
      currency: code,
      style: "currency"
    }).format(converted);
  } catch (error) {
    return `${code} ${converted.toFixed(2)}`;
  }
}

function pct(numerator, denominator) {
  if (!denominator) return 0;
  return (numerator / denominator) * 100;
}

function classifyRatio(type, percent) {
  const rules = {
    food: [32, 38],
    labor: [25, 32],
    rent: [10, 15],
    margin: [5, 12]
  };

  if (type === "margin") {
    if (percent >= rules.margin[1]) return ["良好", "good"];
    if (percent >= rules.margin[0]) return ["注意", "watch"];
    return ["危险", "danger"];
  }

  const [watch, danger] = rules[type];
  if (percent < watch) return ["良好", "good"];
  if (percent <= danger) return ["注意", "watch"];
  return ["危险", "danger"];
}

function calculate() {
  const revenue =
    value("dineInSales") +
    value("takeawaySales") +
    value("deliverySales") +
    value("otherSales");

  const costs = {
    food: value("foodCost"),
    labor: value("laborCost"),
    rent: value("rentCost"),
    utility: value("utilityCost"),
    platform: value("platformFees"),
    marketing: value("marketingCost"),
    maintenance: value("maintenanceCost"),
    other: value("otherCost")
  };

  const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
  const profit = revenue - totalCost;
  const margin = pct(profit, revenue);

  const itemPrice = value("itemPrice");
  const commission = itemPrice * (value("commissionRate") / 100);
  const ingredientTotal = calculateIngredientTotal();
  const ingredientCost = value("itemIngredientCost") || ingredientTotal;
  const itemTotalCost =
    ingredientCost +
    value("itemPackagingCost") +
    value("itemOtherCost") +
    commission;
  const itemGrossProfit = itemPrice - itemTotalCost;
  const itemGrossMargin = pct(itemGrossProfit, itemPrice);

  const targetMargin = Math.min(Math.max(value("targetMargin"), 1), 95);
  const rawSuggested = itemTotalCost / (1 - targetMargin / 100);
  const suggestedPrice = roundToEnding(rawSuggested, fields.priceEnding.value);

  return {
    revenue,
    costs,
    totalCost,
    profit,
    margin,
    itemPrice,
    ingredientTotal,
    ingredientCost,
    commission,
    itemTotalCost,
    itemGrossProfit,
    itemGrossMargin,
    suggestedPrice
  };
}

function roundToEnding(amount, ending) {
  if (!amount || !Number.isFinite(amount)) return 0;
  if (ending === "0.00") return Math.ceil(amount);
  const base = Math.floor(amount);
  const candidate = base + Number(ending);
  return candidate >= amount ? candidate : base + 1 + Number(ending);
}

function statusFor(data) {
  if (!data.revenue) return ["待输入", "填写数字后自动判断。", ""];
  const [, marginLevel] = classifyRatio("margin", data.margin);
  const foodLevel = classifyRatio("food", pct(data.costs.food, data.revenue))[1];
  const laborLevel = classifyRatio("labor", pct(data.costs.labor, data.revenue))[1];
  const rentLevel = classifyRatio("rent", pct(data.costs.rent, data.revenue))[1];

  if ([marginLevel, foodLevel, laborLevel, rentLevel].includes("danger")) {
    return ["危险", "至少一个关键指标已经超过危险区。", "danger"];
  }

  if ([marginLevel, foodLevel, laborLevel, rentLevel].includes("watch")) {
    return ["注意", "经营还有利润，但需要检查成本。", "watch"];
  }

  return ["良好", "主要比例暂时健康，可以继续优化菜单。", "good"];
}

function render() {
  const data = calculate();
  const [status, statusHint, statusClass] = statusFor(data);

  setText("metricRevenue", formatMoney(data.revenue));
  setText("metricRevenueUsd", formatUsd(data.revenue));
  setText("metricProfit", formatMoney(data.profit));
  setText("metricMargin", `${data.margin.toFixed(1)}% 净利率`);
  setText("metricGrossMargin", `${data.itemGrossMargin.toFixed(1)}%`);
  setText("metricGrossProfit", `毛利 ${formatMoney(data.itemGrossProfit)}`);
  setText("metricStatus", status);
  setText("metricStatusHint", statusHint);
  updateStatusClass(document.querySelector(".status-card"), statusClass);
  setText("profitRevenueResult", formatMoney(data.revenue));
  setText("profitRevenueUsdResult", formatUsd(data.revenue));
  setText("profitCostResult", formatMoney(data.totalCost));
  setText("profitNetResult", formatMoney(data.profit));
  setText("profitMarginResult", `${data.margin.toFixed(1)}% 净利率`);
  setText("profitStatusResult", status);
  setText("profitStatusHintResult", statusHint);
  updateStatusClass(document.querySelector(".status-card-inline"), statusClass);

  setText("itemTotalCost", formatMoney(data.itemTotalCost));
  setText("ingredientTotalCost", formatMoney(data.ingredientTotal));
  setText("itemCommission", formatMoney(data.commission));
  setText("itemGrossProfit", formatMoney(data.itemGrossProfit));
  setText("itemGrossMargin", `${data.itemGrossMargin.toFixed(1)}%`);
  setText("itemUsdPrice", formatUsd(data.itemPrice));
  setText("itemAdvice", itemAdvice(data));

  setText("suggestedPrice", formatMoney(data.suggestedPrice));
  setText("suggestedUsd", formatUsd(data.suggestedPrice));
  setText("pricingAdvice", pricingAdvice(data));

  setText("reportTitle", `${fields.restaurantName.value || "餐厅"}经营利润报告`);
  setText("reportDate", fields.reportMonth.value || new Date().toISOString().slice(0, 7));
  setText("reportStatus", status);
  setText("reportProfit", formatMoney(data.profit));
  setText("reportMargin", `${data.margin.toFixed(1)}%`);
  setText("menuSummary", menuSummary(data));

  renderRatios(data);
  renderRatios(data, "#profitRatioTable");
  renderActions(data);
  renderActions(data, "#profitActionList");
}

function setText(id, text) {
  const node = document.querySelector(`#${id}`);
  if (node) node.textContent = text;
}

function updateStatusClass(node, statusClass) {
  node.classList.remove("status-good", "status-watch", "status-danger");
  if (statusClass) node.classList.add(`status-${statusClass}`);
}

function itemAdvice(data) {
  if (!data.itemPrice) return "输入售价和成本后，会自动判断这个单品是否值得继续卖。";
  if (data.itemGrossMargin >= 65) return "这个单品毛利健康，可以作为主推产品。";
  if (data.itemGrossMargin >= 50) return "这个单品可以继续卖，但仍有调价或降成本空间。";
  if (data.itemGrossMargin > 0) return "这个单品毛利偏低，建议检查食材、包装或平台抽佣。";
  return "这个单品目前可能亏钱，应立即调价或停售检查。";
}

function pricingAdvice(data) {
  if (!data.itemTotalCost) return "建议售价会根据单品总成本和目标毛利率自动计算。";
  return `如果目标毛利率是 ${value("targetMargin").toFixed(0)}%，建议售价至少设为 ${formatMoney(data.suggestedPrice)}。`;
}

function menuSummary(data) {
  if (!data.itemPrice) return "还没有输入单品资料。";
  const name = fields.itemName.value || "这个单品";
  return `${name} 当前售价 ${formatMoney(data.itemPrice)}，食材成本 ${formatMoney(data.ingredientCost)}，单品总成本 ${formatMoney(data.itemTotalCost)}，毛利率 ${data.itemGrossMargin.toFixed(1)}%。建议参考售价为 ${formatMoney(data.suggestedPrice)} / ${formatUsd(data.suggestedPrice)}。`;
}

function calculateIngredientTotal() {
  return ingredientRows.reduce((sum, row) => {
    const price = Number(row.buyPrice || 0);
    const buyQty = Number(row.buyQty || 0);
    const usedQty = Number(row.usedQty || 0);
    if (!price || !buyQty || !usedQty) return sum;
    return sum + (price / buyQty) * usedQty;
  }, 0);
}

function ingredientCost(row) {
  const price = Number(row.buyPrice || 0);
  const buyQty = Number(row.buyQty || 0);
  const usedQty = Number(row.usedQty || 0);
  if (!price || !buyQty || !usedQty) return 0;
  return (price / buyQty) * usedQty;
}

function addIngredient(row = {}) {
  ingredientRows.push({
    id: ingredientId++,
    name: row.name || "",
    buyPrice: row.buyPrice || "",
    buyQty: row.buyQty || "",
    unit: row.unit || "g",
    usedQty: row.usedQty || ""
  });
  renderIngredientRows();
  render();
}

function renderIngredientRows() {
  const container = document.querySelector("#ingredientRows");
  if (!container) return;

  if (!ingredientRows.length) {
    container.innerHTML = `<div class="ingredient-row"><span class="field-help">先按“加材料”，例如鸡肉、米、酱料、油、配菜。</span></div>`;
    return;
  }

  container.innerHTML = ingredientRows.map((row) => `
    <div class="ingredient-row" data-id="${row.id}">
      <input data-field="name" value="${escapeHtml(row.name)}" placeholder="鸡肉">
      <input data-field="buyPrice" type="number" min="0" step="0.01" value="${escapeHtml(row.buyPrice)}" placeholder="18">
      <input data-field="buyQty" type="number" min="0" step="0.01" value="${escapeHtml(row.buyQty)}" placeholder="1000">
      <select data-field="unit">
        <option value="g"${row.unit === "g" ? " selected" : ""}>g</option>
        <option value="ml"${row.unit === "ml" ? " selected" : ""}>ml</option>
        <option value="pcs"${row.unit === "pcs" ? " selected" : ""}>pcs</option>
      </select>
      <input data-field="usedQty" type="number" min="0" step="0.01" value="${escapeHtml(row.usedQty)}" placeholder="120">
      <span class="ingredient-cost">${formatMoney(ingredientCost(row))}</span>
      <button class="icon-button" type="button" data-remove="${row.id}" aria-label="删除材料">×</button>
    </div>
  `).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

function renderRatios(data, target = "#ratioTable") {
  const rows = [
    ["食材成本", pct(data.costs.food, data.revenue), classifyRatio("food", pct(data.costs.food, data.revenue))],
    ["人工成本", pct(data.costs.labor, data.revenue), classifyRatio("labor", pct(data.costs.labor, data.revenue))],
    ["租金", pct(data.costs.rent, data.revenue), classifyRatio("rent", pct(data.costs.rent, data.revenue))],
    ["净利润率", data.margin, classifyRatio("margin", data.margin)]
  ];

  const table = document.querySelector(target);
  if (!table) return;
  table.innerHTML = rows
    .map(([label, percent, [text, level]]) => {
      return `<div class="ratio-row"><span>${label}</span><strong>${percent.toFixed(1)}%</strong><span class="ratio-pill pill-${level}">${text}</span></div>`;
    })
    .join("");
}

function renderActions(data, target = "#actionList") {
  const actions = [];
  if (!data.revenue) {
    actions.push("先输入本月销售额和主要成本，报告才会有实际判断。");
  }
  if (pct(data.costs.food, data.revenue) > 38) {
    actions.push("食材成本已经偏高，优先检查采购价、份量和浪费。");
  }
  if (pct(data.costs.labor, data.revenue) > 32) {
    actions.push("人工比例偏高，检查排班、淡季人手和高峰时段效率。");
  }
  if (pct(data.costs.rent, data.revenue) > 15) {
    actions.push("租金压力危险，需要提高营业额、增加外带收入或重新评估地点成本。");
  }
  if (data.margin < 5 && data.revenue) {
    actions.push("净利润率低于 5%，先不要扩张，优先处理成本和菜单售价。");
  }
  if (data.itemPrice && data.itemGrossMargin < 50) {
    actions.push("主推单品毛利偏低，建议调价或重算食材与包装成本。");
  }
  if (!actions.length) {
    actions.push("主要指标健康，下一步可以优化高毛利产品和回头客套餐。");
  }

  const list = document.querySelector(target);
  if (!list) return;
  list.innerHTML = actions.map((action) => `<li>${action}</li>`).join("");
}

function switchSection(targetId, shouldScroll = false) {
  document.querySelectorAll(".tool-section").forEach((section) => {
    section.classList.toggle("active", section.id === targetId);
  });
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.target === targetId);
  });

  if (shouldScroll) {
    const target = document.querySelector(`#${targetId}`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function fillSample() {
  const sample = {
    restaurantName: "ABC Kopitiam",
    reportMonth: "2026-06",
    referenceCurrency: "USD",
    exchangeRate: "4.70",
    dineInSales: "38000",
    takeawaySales: "9200",
    deliverySales: "12800",
    otherSales: "1500",
    foodCost: "19500",
    laborCost: "14800",
    rentCost: "6500",
    utilityCost: "2200",
    platformFees: "3200",
    marketingCost: "900",
    maintenanceCost: "700",
    otherCost: "1800",
    itemName: "Nasi Lemak Ayam",
    itemPrice: "13.90",
    itemIngredientCost: "4.10",
    itemPackagingCost: "0.70",
    itemOtherCost: "0.40",
    commissionRate: "18",
    targetMargin: "65",
    priceEnding: "0.90"
  };

  Object.entries(sample).forEach(([id, sampleValue]) => {
    fields[id].value = sampleValue;
  });
  ingredientRows = [];
  ingredientId = 0;
  [
    { name: "鸡腿肉", buyPrice: "18", buyQty: "1000", unit: "g", usedQty: "120" },
    { name: "米饭", buyPrice: "32", buyQty: "10000", unit: "g", usedQty: "180" },
    { name: "参巴酱", buyPrice: "12", buyQty: "1000", unit: "g", usedQty: "35" },
    { name: "黄瓜和小料", buyPrice: "8", buyQty: "1000", unit: "g", usedQty: "50" }
  ].forEach((row) => {
    ingredientRows.push({ id: ingredientId++, ...row });
  });
  fields.itemIngredientCost.value = calculateIngredientTotal().toFixed(2);
  renderIngredientRows();
  render();
}

function resetAll() {
  Object.values(fields).forEach((field) => {
    if (field.tagName === "SELECT") {
      field.value = "0.90";
    } else {
      field.value = "";
    }
  });
  fields.exchangeRate.value = "4.70";
  fields.referenceCurrency.value = "USD";
  fields.targetMargin.value = "65";
  ingredientRows = [];
  ingredientId = 0;
  renderIngredientRows();
  render();
}

document.querySelectorAll("input, select").forEach((field) => {
  field.addEventListener("input", render);
});

fields.referenceCurrency.addEventListener("change", () => {
  const selected = fields.referenceCurrency.selectedOptions[0];
  fields.exchangeRate.value = selected?.dataset.rate || "4.70";
  render();
});

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => switchSection(button.dataset.target, false));
});

document.querySelectorAll("[data-jump]").forEach((button) => {
  button.addEventListener("click", () => switchSection(button.dataset.jump, true));
});

document.querySelector("#sampleButton").addEventListener("click", fillSample);
document.querySelector("#resetButton").addEventListener("click", resetAll);
document.querySelector("#printButton").addEventListener("click", () => window.print());
document.querySelector("#addIngredientButton").addEventListener("click", () => addIngredient());
document.querySelector("#useIngredientCostButton").addEventListener("click", () => {
  fields.itemIngredientCost.value = calculateIngredientTotal().toFixed(2);
  render();
});
document.querySelector("#ingredientRows").addEventListener("input", (event) => {
  const rowElement = event.target.closest(".ingredient-row");
  if (!rowElement || !event.target.dataset.field) return;
  const row = ingredientRows.find((item) => item.id === Number(rowElement.dataset.id));
  if (!row) return;
  row[event.target.dataset.field] = event.target.value;
  rowElement.querySelector(".ingredient-cost").textContent = formatMoney(ingredientCost(row));
  render();
});
document.querySelector("#ingredientRows").addEventListener("change", (event) => {
  const rowElement = event.target.closest(".ingredient-row");
  if (!rowElement || !event.target.dataset.field) return;
  const row = ingredientRows.find((item) => item.id === Number(rowElement.dataset.id));
  if (!row) return;
  row[event.target.dataset.field] = event.target.value;
  rowElement.querySelector(".ingredient-cost").textContent = formatMoney(ingredientCost(row));
  render();
});
document.querySelector("#ingredientRows").addEventListener("click", (event) => {
  const removeId = event.target.dataset.remove;
  if (removeId === undefined) return;
  ingredientRows = ingredientRows.filter((row) => row.id !== Number(removeId));
  renderIngredientRows();
  render();
});

renderIngredientRows();
render();
