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
let diagnosisGroupIndex = 0;
let diagnosisAnswers = {};

const STORAGE_KEY = "rdps_toolkit_v2_state";

const diagnosticGroups = [
  {
    code: "A",
    title: "基本资料",
    questions: [
      { question_id: "A1", question_text: "你的餐厅类型是什么？", input_type: "select", options: [{ value: "", label: "请选择", risk: 0 }, { value: "restaurant", label: "餐厅 / 咖啡店", risk: 0 }, { value: "hawker", label: "档口 / 小吃摊", risk: 0 }, { value: "cloud", label: "Cloud Kitchen", risk: 1 }, { value: "food_truck", label: "Food Truck", risk: 1 }], risk_weight: 1 },
      { question_id: "A2", question_text: "目前营业多久了？", input_type: "select", options: [{ value: "", label: "请选择", risk: 0 }, { value: "under_6m", label: "少过6个月", risk: 2 }, { value: "6m_2y", label: "6个月到2年", risk: 1 }, { value: "over_2y", label: "超过2年", risk: 0 }], risk_weight: 1 },
      { question_id: "A3", question_text: "每周营业几天？", input_type: "number", risk_weight: 1 },
      { question_id: "A4", question_text: "每天平均营业几个小时？", input_type: "number", risk_weight: 1 },
      { question_id: "A5", question_text: "你是否有固定记录每日营业额？", input_type: "radio", options: [{ value: "yes", label: "每天都有", risk: 0 }, { value: "sometimes", label: "有时才记", risk: 2 }, { value: "no", label: "没有固定记录", risk: 4 }], risk_weight: 4 }
    ]
  },
  {
    code: "B",
    title: "营业额与客单价",
    questions: [
      { question_id: "B1", question_text: "每天平均几张单？", input_type: "number", risk_weight: 1 },
      { question_id: "B2", question_text: "平均客单价大约多少 RM？", input_type: "number", risk_weight: 1 },
      { question_id: "B3", question_text: "过去3个月营业额趋势？", input_type: "select", options: [{ value: "", label: "请选择", risk: 0 }, { value: "up", label: "上升", risk: 0 }, { value: "flat", label: "差不多", risk: 1 }, { value: "down", label: "下降", risk: 4 }], risk_weight: 4 },
      { question_id: "B4", question_text: "外卖平台占营业额比例？", input_type: "select", options: [{ value: "", label: "请选择", risk: 0 }, { value: "low", label: "低于20%", risk: 0 }, { value: "medium", label: "20% - 40%", risk: 1 }, { value: "high", label: "超过40%", risk: 3 }], risk_weight: 3 },
      { question_id: "B5", question_text: "是否知道哪些产品贡献最多营业额？", input_type: "radio", options: [{ value: "yes", label: "知道", risk: 0 }, { value: "roughly", label: "大概知道", risk: 1 }, { value: "no", label: "不知道", risk: 3 }], risk_weight: 3 }
    ]
  },
  {
    code: "C",
    title: "食材与饮料成本",
    questions: [
      { question_id: "C1", question_text: "是否每月计算 Food Cost？", input_type: "radio", options: [{ value: "yes", label: "每月都有", risk: 0 }, { value: "sometimes", label: "有时才算", risk: 2 }, { value: "no", label: "没有", risk: 5 }], risk_weight: 5 },
      { question_id: "C2", question_text: "是否有标准配方和份量？", input_type: "radio", options: [{ value: "yes", label: "有", risk: 0 }, { value: "partial", label: "部分有", risk: 2 }, { value: "no", label: "没有", risk: 4 }], risk_weight: 4 },
      { question_id: "C3", question_text: "是否每周记录浪费 / 报废？", input_type: "radio", options: [{ value: "yes", label: "有", risk: 0 }, { value: "sometimes", label: "偶尔", risk: 2 }, { value: "no", label: "没有", risk: 4 }], risk_weight: 4 },
      { question_id: "C4", question_text: "主要食材价格上涨时，你会多久调整售价？", input_type: "select", options: [{ value: "", label: "请选择", risk: 0 }, { value: "fast", label: "1个月内", risk: 0 }, { value: "slow", label: "2-3个月后", risk: 2 }, { value: "never", label: "通常不调", risk: 5 }], risk_weight: 5 },
      { question_id: "C5", question_text: "是否知道每道主打菜的食材成本？", input_type: "radio", options: [{ value: "yes", label: "知道", risk: 0 }, { value: "some", label: "只知道部分", risk: 2 }, { value: "no", label: "不知道", risk: 5 }], risk_weight: 5 }
    ]
  },
  {
    code: "D",
    title: "人工与员工效率",
    questions: [
      { question_id: "D1", question_text: "目前全职员工人数？", input_type: "number", risk_weight: 1 },
      { question_id: "D2", question_text: "目前兼职员工人数？", input_type: "number", risk_weight: 1 },
      { question_id: "D3", question_text: "是否按高峰/低峰安排人手？", input_type: "radio", options: [{ value: "yes", label: "有", risk: 0 }, { value: "some", label: "大概安排", risk: 2 }, { value: "no", label: "没有", risk: 4 }], risk_weight: 4 },
      { question_id: "D4", question_text: "是否知道每小时营业额和人工效率？", input_type: "radio", options: [{ value: "yes", label: "知道", risk: 0 }, { value: "no", label: "不知道", risk: 4 }], risk_weight: 4 },
      { question_id: "D5", question_text: "老板不在时，店是否能稳定运作？", input_type: "radio", options: [{ value: "stable", label: "可以稳定运作", risk: 0 }, { value: "sometimes", label: "有时会乱", risk: 2 }, { value: "owner_required", label: "必须老板在", risk: 5 }], risk_weight: 5 }
    ]
  },
  {
    code: "E",
    title: "租金、水电与固定费用",
    questions: [
      { question_id: "E1", question_text: "每月租金 RM？", input_type: "number", risk_weight: 1 },
      { question_id: "E2", question_text: "每月水电煤 RM？", input_type: "number", risk_weight: 1 },
      { question_id: "E3", question_text: "是否每月检查固定费用比例？", input_type: "radio", options: [{ value: "yes", label: "有", risk: 0 }, { value: "sometimes", label: "偶尔", risk: 2 }, { value: "no", label: "没有", risk: 4 }], risk_weight: 4 },
      { question_id: "E4", question_text: "租约未来12个月是否会涨租？", input_type: "radio", options: [{ value: "no", label: "不会 / 不确定", risk: 1 }, { value: "yes", label: "会", risk: 3 }], risk_weight: 3 },
      { question_id: "E5", question_text: "是否有检查高耗电设备？", input_type: "radio", options: [{ value: "yes", label: "有", risk: 0 }, { value: "no", label: "没有", risk: 3 }], risk_weight: 3 }
    ]
  },
  {
    code: "F",
    title: "菜单与 SKU",
    questions: [
      { question_id: "F1", question_text: "菜单上大约有多少个 SKU / 产品？", input_type: "number", risk_weight: 4 },
      { question_id: "F2", question_text: "你觉得菜单数量是否太多？", input_type: "radio", options: [{ value: "ok", label: "刚好", risk: 0 }, { value: "not_sure", label: "不确定", risk: 2 }, { value: "too_many", label: "太多", risk: 4 }], risk_weight: 4 },
      { question_id: "F3", question_text: "是否知道每个 SKU 的销量？", input_type: "radio", options: [{ value: "yes", label: "知道", risk: 0 }, { value: "some", label: "部分知道", risk: 2 }, { value: "no", label: "不知道", risk: 4 }], risk_weight: 4 },
      { question_id: "F4", question_text: "是否知道每个 SKU 的毛利？", input_type: "radio", options: [{ value: "yes", label: "知道", risk: 0 }, { value: "some", label: "部分知道", risk: 2 }, { value: "no", label: "不知道", risk: 5 }], risk_weight: 5 },
      { question_id: "F5", question_text: "多久删除一次低销量产品？", input_type: "select", options: [{ value: "", label: "请选择", risk: 0 }, { value: "monthly", label: "每月检查", risk: 0 }, { value: "quarterly", label: "每季检查", risk: 1 }, { value: "rarely", label: "很少删除", risk: 4 }], risk_weight: 4 }
    ]
  },
  {
    code: "G",
    title: "库存与供应商",
    questions: [
      { question_id: "G1", question_text: "多久盘点一次库存？", input_type: "select", options: [{ value: "", label: "请选择", risk: 0 }, { value: "weekly", label: "每周", risk: 0 }, { value: "monthly", label: "每月", risk: 1 }, { value: "rarely", label: "很少", risk: 4 }, { value: "never", label: "没有盘点", risk: 6 }], risk_weight: 6 },
      { question_id: "G2", question_text: "是否有比较供应商价格？", input_type: "radio", options: [{ value: "yes", label: "有", risk: 0 }, { value: "sometimes", label: "偶尔", risk: 1 }, { value: "no", label: "没有", risk: 3 }], risk_weight: 3 },
      { question_id: "G3", question_text: "是否记录采购价变化？", input_type: "radio", options: [{ value: "yes", label: "有", risk: 0 }, { value: "no", label: "没有", risk: 4 }], risk_weight: 4 },
      { question_id: "G4", question_text: "目前是否有欠供应商款项？", input_type: "radio", options: [{ value: "no", label: "没有", risk: 0 }, { value: "yes", label: "有", risk: 5 }], risk_weight: 5 },
      { question_id: "G5", question_text: "供应商付款是否经常延迟？", input_type: "radio", options: [{ value: "on_time", label: "准时", risk: 0 }, { value: "sometimes", label: "偶尔延迟", risk: 2 }, { value: "late", label: "经常延迟", risk: 5 }], risk_weight: 5 }
    ]
  },
  {
    code: "H",
    title: "老板管理习惯与现金流",
    questions: [
      { question_id: "H1", question_text: "现金流大约够撑几周固定费用？", input_type: "number", risk_weight: 6 },
      { question_id: "H2", question_text: "是否经常现金不够付账单？", input_type: "radio", options: [{ value: "no", label: "不会", risk: 0 }, { value: "sometimes", label: "偶尔", risk: 3 }, { value: "often_short", label: "经常", risk: 6 }], risk_weight: 6 },
      { question_id: "H3", question_text: "老板是否每月看 P&L / 利润表？", input_type: "select", options: [{ value: "", label: "请选择", risk: 0 }, { value: "monthly", label: "每月看", risk: 0 }, { value: "rarely", label: "很少看", risk: 5 }, { value: "never", label: "没有看", risk: 7 }], risk_weight: 7 },
      { question_id: "H4", question_text: "老板是否有固定薪水？", input_type: "radio", options: [{ value: "yes", label: "有", risk: 0 }, { value: "no", label: "没有", risk: 5 }], risk_weight: 5 },
      { question_id: "H5", question_text: "关键决定是否都必须老板本人处理？", input_type: "radio", options: [{ value: "team_can_handle", label: "团队可以处理部分", risk: 0 }, { value: "some_owner", label: "多数还是老板", risk: 3 }, { value: "owner_only", label: "几乎都靠老板", risk: 6 }], risk_weight: 6 }
    ]
  }
];

window.RDPS_DIAGNOSTIC_QUESTION_MAP = diagnosticGroups
  .flatMap((group) => group.questions)
  .reduce((map, question) => {
    map[question.question_id] = question;
    return map;
  }, {});

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
  const code = fields.referenceCurrency?.value || "SGD";
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
  const diagnosis = diagnosisResult(data);
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
  renderDiagnosisSummary(diagnosis);
  renderReportDiagnosis(diagnosis);
  saveState();
}

function diagnosisResult(data = calculate()) {
  if (!window.RDPS_RISK_RULES?.analyze) {
    return {
      score: 0,
      riskLevel: "待输入",
      answeredCount: 0,
      totalQuestions: 40,
      topRisks: [],
      recommendations: [],
      knowledge: [],
      improvement: "完成诊断并输入利润数据后，系统会显示预计改善方向。"
    };
  }
  return window.RDPS_RISK_RULES.analyze(data, diagnosisAnswers);
}

function setText(id, text) {
  const node = document.querySelector(`#${id}`);
  if (node) node.textContent = text;
}

function renderDiagnosisQuestions() {
  const group = diagnosticGroups[diagnosisGroupIndex];
  const container = document.querySelector("#diagnosisQuestions");
  if (!group || !container) return;

  setText("diagnosisGroupCode", group.code);
  setText("diagnosisGroupTitle", group.title);
  setText("diagnosisGroupCounter", `第 ${diagnosisGroupIndex + 1} 组 / 共 ${diagnosticGroups.length} 组`);

  container.innerHTML = group.questions.map((question) => {
    const value = diagnosisAnswers[question.question_id] || "";
    return `
      <article class="diagnosis-question">
        <div class="diagnosis-question-title">
          <strong>${escapeHtml(question.question_text)}</strong>
          <span>${question.question_id}</span>
        </div>
        ${diagnosisInputHtml(question, value)}
      </article>
    `;
  }).join("");

  const prevButton = document.querySelector("#diagnosisPrevButton");
  const nextButton = document.querySelector("#diagnosisNextButton");
  if (prevButton) prevButton.disabled = diagnosisGroupIndex === 0;
  if (nextButton) nextButton.textContent = diagnosisGroupIndex === diagnosticGroups.length - 1 ? "查看报告" : "下一组";
  updateDiagnosisProgress();
}

function diagnosisInputHtml(question, value) {
  if (question.input_type === "number") {
    return `<label><input data-diagnosis-id="${question.question_id}" type="number" min="0" step="0.01" value="${escapeHtml(value)}" placeholder="输入数字"></label>`;
  }

  if (question.input_type === "select") {
    const options = (question.options || []).map((option) => {
      const selected = String(option.value) === String(value) ? " selected" : "";
      return `<option value="${escapeHtml(option.value)}"${selected}>${escapeHtml(option.label)}</option>`;
    }).join("");
    return `<label><select data-diagnosis-id="${question.question_id}">${options}</select></label>`;
  }

  return `
    <div class="diagnosis-options">
      ${(question.options || []).map((option) => {
        const checked = String(option.value) === String(value) ? " checked" : "";
        return `
          <label>
            <input data-diagnosis-id="${question.question_id}" name="${question.question_id}" type="radio" value="${escapeHtml(option.value)}"${checked}>
            <span>${escapeHtml(option.label)}</span>
          </label>
        `;
      }).join("")}
    </div>
  `;
}

function updateDiagnosisProgress() {
  const total = diagnosticGroups.reduce((sum, group) => sum + group.questions.length, 0);
  const answered = Object.values(diagnosisAnswers).filter((answer) => String(answer || "").trim() !== "").length;
  const percent = total ? (answered / total) * 100 : 0;
  setText("diagnosisProgressText", `${answered} / ${total} 已完成`);
  setText("diagnosisAnsweredCount", `${answered} / ${total}`);
  const progressBar = document.querySelector("#diagnosisProgressBar");
  if (progressBar) progressBar.style.width = `${percent}%`;
}

function renderDiagnosisSummary(diagnosis) {
  setText("diagnosisScore", `${diagnosis.score} / 100`);
  setText("diagnosisRiskLevel", diagnosis.riskLevel);
  setText("diagnosisAnsweredCount", `${diagnosis.answeredCount} / ${diagnosis.totalQuestions}`);
  updateDiagnosisProgress();

  const list = document.querySelector("#diagnosisTopRisks");
  if (!list) return;
  const risks = diagnosis.topRisks?.length
    ? diagnosis.topRisks.map((risk) => risk.title)
    : ["完成题目后会显示主要风险。"];
  list.innerHTML = risks.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderReportDiagnosis(diagnosis) {
  setText("reportHealthScore", `${diagnosis.score} / 100`);
  setText("reportRiskLevel", diagnosis.riskLevel);
  setText("reportDiagnosisProgress", `${diagnosis.answeredCount} / ${diagnosis.totalQuestions}`);
  setText("reportImprovement", diagnosis.improvement);

  const risks = diagnosis.topRisks?.length
    ? diagnosis.topRisks.map((risk) => `${risk.title}：${risk.reasons?.[0] || "需要优先检查。"}`)
    : ["完成40题诊断后会显示最大风险。"];
  const recommendations = diagnosis.recommendations?.length
    ? diagnosis.recommendations
    : ["完成诊断后会显示建议。"];

  const riskList = document.querySelector("#reportTopRisks");
  const recList = document.querySelector("#reportTopRecommendations");
  if (riskList) riskList.innerHTML = risks.slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  if (recList) recList.innerHTML = recommendations.slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  const knowledgeList = document.querySelector("#reportKnowledge");
  if (!knowledgeList) return;
  const knowledge = diagnosis.knowledge?.length ? diagnosis.knowledge : [{
    title: "餐厅诊断知识",
    explanation: "完成利润输入和40题诊断后，这里会显示被触发的餐饮知识解释。",
    action: "先输入真实数字，再根据风险排序处理。"
  }];
  knowledgeList.innerHTML = knowledge.slice(0, 3).map((item) => `
    <article class="knowledge-card">
      <h4>${escapeHtml(item.title)}</h4>
      <p>${escapeHtml(item.explanation)}</p>
      <p><strong>行动建议：</strong>${escapeHtml(item.action)}</p>
    </article>
  `).join("");
}

function saveState() {
  const payload = {
    fields: Object.fromEntries(Object.entries(fields).map(([id, field]) => [id, field.value])),
    ingredientRows,
    ingredientId,
    diagnosisAnswers,
    diagnosisGroupIndex
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    // localStorage may be unavailable in strict browser modes; calculations still work.
  }
}

function loadState() {
  try {
    const payload = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    Object.entries(payload.fields || {}).forEach(([id, savedValue]) => {
      if (fields[id]) fields[id].value = savedValue;
    });
    if (!["SGD", "TWD", "CNY", "USD"].includes(fields.referenceCurrency.value)) {
      fields.referenceCurrency.value = "SGD";
      fields.exchangeRate.value = "3.50";
    }
    ingredientRows = Array.isArray(payload.ingredientRows) ? payload.ingredientRows : [];
    ingredientId = Number(payload.ingredientId || ingredientRows.length || 0);
    diagnosisAnswers = payload.diagnosisAnswers || {};
    diagnosisGroupIndex = Math.min(Math.max(Number(payload.diagnosisGroupIndex || 0), 0), diagnosticGroups.length - 1);
  } catch (error) {
    diagnosisAnswers = {};
  }
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
    container.innerHTML = `<div class="ingredient-row"><span class="field-help">先按“加一个食材”。一道菜可以加入很多行，例如鸡肉、米、酱料、油、配菜、包装前处理损耗等。</span></div>`;
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
    referenceCurrency: "SGD",
    exchangeRate: "3.50",
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
  diagnosisAnswers = {
    A1: "restaurant",
    A2: "over_2y",
    A3: "6",
    A4: "11",
    A5: "yes",
    B1: "180",
    B2: "18",
    B3: "flat",
    B4: "medium",
    B5: "roughly",
    C1: "sometimes",
    C2: "partial",
    C3: "no",
    C4: "slow",
    C5: "some",
    D1: "5",
    D2: "3",
    D3: "some",
    D4: "no",
    D5: "sometimes",
    E1: "6500",
    E2: "2200",
    E3: "sometimes",
    E4: "no",
    E5: "no",
    F1: "78",
    F2: "not_sure",
    F3: "some",
    F4: "no",
    F5: "rarely",
    G1: "rarely",
    G2: "sometimes",
    G3: "no",
    G4: "no",
    G5: "sometimes",
    H1: "3",
    H2: "sometimes",
    H3: "rarely",
    H4: "no",
    H5: "some_owner"
  };
  diagnosisGroupIndex = 0;
  fields.itemIngredientCost.value = calculateIngredientTotal().toFixed(2);
  renderIngredientRows();
  renderDiagnosisQuestions();
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
  fields.exchangeRate.value = "3.50";
  fields.referenceCurrency.value = "SGD";
  fields.targetMargin.value = "65";
  ingredientRows = [];
  ingredientId = 0;
  diagnosisAnswers = {};
  diagnosisGroupIndex = 0;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Ignore storage cleanup errors.
  }
  renderIngredientRows();
  renderDiagnosisQuestions();
  render();
}

document.querySelectorAll("input, select").forEach((field) => {
  field.addEventListener("input", render);
});

fields.referenceCurrency.addEventListener("change", () => {
  const selected = fields.referenceCurrency.selectedOptions[0];
  fields.exchangeRate.value = selected?.dataset.rate || "3.50";
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

document.querySelector("#diagnosisQuestions").addEventListener("input", (event) => {
  const questionId = event.target.dataset.diagnosisId;
  if (!questionId) return;
  diagnosisAnswers[questionId] = event.target.value;
  render();
});

document.querySelector("#diagnosisQuestions").addEventListener("change", (event) => {
  const questionId = event.target.dataset.diagnosisId;
  if (!questionId) return;
  diagnosisAnswers[questionId] = event.target.value;
  render();
});

document.querySelector("#diagnosisPrevButton").addEventListener("click", () => {
  diagnosisGroupIndex = Math.max(0, diagnosisGroupIndex - 1);
  renderDiagnosisQuestions();
  render();
});

document.querySelector("#diagnosisNextButton").addEventListener("click", () => {
  if (diagnosisGroupIndex >= diagnosticGroups.length - 1) {
    switchSection("report", true);
    return;
  }
  diagnosisGroupIndex += 1;
  renderDiagnosisQuestions();
  render();
});

loadState();
renderIngredientRows();
renderDiagnosisQuestions();
render();
