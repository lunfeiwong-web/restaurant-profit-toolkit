function answerNumber(answers, id) {
  const value = Number(answers[id]);
  return Number.isFinite(value) ? value : 0;
}

function answerText(answers, id) {
  return String(answers[id] || "");
}

function ratioPercent(value, revenue) {
  if (!revenue) return 0;
  return (value / revenue) * 100;
}

function addRisk(risks, risk) {
  if (!risk || !risk.id) return;
  const existing = risks.find((item) => item.id === risk.id);
  if (existing) {
    existing.score += risk.score || 0;
    existing.reasons = [...new Set([...(existing.reasons || []), ...(risk.reasons || [])])];
    return;
  }
  risks.push({
    id: risk.id,
    title: risk.title,
    score: risk.score || 0,
    reasons: risk.reasons || [],
    suggestion: risk.suggestion || "",
    knowledge_key: risk.knowledge_key || risk.id
  });
}

function analyzeRestaurantRisk(data, answers = {}) {
  const revenue = data.revenue || 0;
  const risks = [];
  const foodPercent = ratioPercent(data.costs?.food || 0, revenue);
  const payrollPercent = ratioPercent(data.costs?.labor || 0, revenue);
  const rentPercent = ratioPercent(data.costs?.rent || 0, revenue);
  const utilityPercent = ratioPercent(data.costs?.utility || 0, revenue);
  const netProfitPercent = data.margin || 0;
  const skuCount = answerNumber(answers, "F1");
  const cashWeeks = answerNumber(answers, "H1");

  if (foodPercent > 38) {
    addRisk(risks, {
      id: "food_cost_high",
      title: "Food Cost 偏高",
      score: 18,
      reasons: [`食材成本约 ${foodPercent.toFixed(1)}%，已超过常见危险区。`],
      suggestion: "先重算高销量产品配方和份量，再处理采购价、浪费和售价。",
      knowledge_key: "food_cost_high"
    });
  } else if (revenue && foodPercent < 18) {
    addRisk(risks, {
      id: "food_cost_low",
      title: "Food Cost 异常偏低",
      score: 6,
      reasons: [`食材成本约 ${foodPercent.toFixed(1)}%，可能有漏记或数据未完整。`],
      suggestion: "确认饮料、调味料、赠品和损耗是否都算入成本。",
      knowledge_key: "food_cost_low"
    });
  }

  if (payrollPercent > 32) {
    addRisk(risks, {
      id: "payroll_high",
      title: "Payroll 偏高",
      score: 16,
      reasons: [`人工成本约 ${payrollPercent.toFixed(1)}%，排班压力明显。`],
      suggestion: "用高峰/低峰时段重新看排班，把人手跟营业额对齐。",
      knowledge_key: "payroll_high"
    });
  }

  if (rentPercent > 15) {
    addRisk(risks, {
      id: "rent_high",
      title: "Rent 偏高",
      score: 14,
      reasons: [`租金约 ${rentPercent.toFixed(1)}%，固定费用压力偏大。`],
      suggestion: "优先提高营业额和外带收入，避免只靠节省小费用解决。",
      knowledge_key: "rent_high"
    });
  }

  if (utilityPercent > 6) {
    addRisk(risks, {
      id: "utility_high",
      title: "Utility 偏高",
      score: 8,
      reasons: [`水电煤约 ${utilityPercent.toFixed(1)}%，需要检查设备和使用习惯。`],
      suggestion: "检查冷气、冰箱、排风、热水和厨房设备的使用时间。",
      knowledge_key: "utility_high"
    });
  }

  if (revenue && netProfitPercent < 5) {
    addRisk(risks, {
      id: "net_profit_low",
      title: "Net Profit 偏低",
      score: 18,
      reasons: [`净利率约 ${netProfitPercent.toFixed(1)}%，低于安全经营水平。`],
      suggestion: "先不要扩张，优先处理最大三项成本和主打产品售价。",
      knowledge_key: "net_profit_low"
    });
  }

  if (skuCount > 80 || answerText(answers, "F2") === "too_many") {
    addRisk(risks, {
      id: "sku_too_many",
      title: "SKU 可能过多",
      score: 12,
      reasons: [`菜单项目数量为 ${skuCount || "未填写"}，可能增加库存和出餐复杂度。`],
      suggestion: "先删除低销量低毛利项目，保留高销量或高毛利产品。",
      knowledge_key: "sku_too_many"
    });
  }

  if (answerText(answers, "G1") === "never" || answerText(answers, "G1") === "rarely") {
    addRisk(risks, {
      id: "no_inventory_count",
      title: "没有固定盘点",
      score: 13,
      reasons: ["库存盘点频率不足，难以发现浪费、漏算和异常用量。"],
      suggestion: "先从贵价食材开始每周盘点一次。",
      knowledge_key: "no_inventory_count"
    });
  }

  if (answerText(answers, "H3") === "never" || answerText(answers, "H3") === "rarely") {
    addRisk(risks, {
      id: "no_monthly_pnl",
      title: "没有每月看 P&L",
      score: 14,
      reasons: ["老板没有固定看每月利润表，容易凭感觉判断赚钱。"],
      suggestion: "每月固定一天整理销售额和主要费用，至少追踪净利率。",
      knowledge_key: "no_monthly_pnl"
    });
  }

  if (answerText(answers, "H4") === "no") {
    addRisk(risks, {
      id: "owner_no_salary",
      title: "老板没有固定薪水",
      score: 10,
      reasons: ["老板薪水没有计入经营成本，利润可能被高估。"],
      suggestion: "给老板设一个固定薪水，再重新看餐厅真实盈利。",
      knowledge_key: "owner_no_salary"
    });
  }

  if ((cashWeeks > 0 && cashWeeks < 4) || answerText(answers, "H2") === "often_short") {
    addRisk(risks, {
      id: "cashflow_danger",
      title: "现金流危险",
      score: 18,
      reasons: [`现金缓冲约 ${cashWeeks || "未填写"} 周，可能撑不过固定账单。`],
      suggestion: "先建立至少1个月固定费用现金缓冲，并减少慢周转库存。",
      knowledge_key: "cashflow_danger"
    });
  }

  if (answerText(answers, "G4") === "yes" || answerText(answers, "G5") === "late") {
    addRisk(risks, {
      id: "supplier_debt",
      title: "欠供应商或付款延迟",
      score: 12,
      reasons: ["供应商付款压力会影响供货稳定、折扣和采购价格。"],
      suggestion: "列出欠款和到期日，优先保护核心供应商。",
      knowledge_key: "supplier_debt"
    });
  }

  if (answerText(answers, "H5") === "owner_only" || answerText(answers, "D5") === "owner_required") {
    addRisk(risks, {
      id: "owner_dependency",
      title: "过度依赖老板本人",
      score: 12,
      reasons: ["关键流程依赖老板，老板不在时容易影响营业质量。"],
      suggestion: "先把开店、收店、采购、备料和收银流程写成清单。",
      knowledge_key: "owner_dependency"
    });
  }

  const answerRisk = Object.entries(answers).reduce((sum, [id, value]) => {
    const question = window.RDPS_DIAGNOSTIC_QUESTION_MAP?.[id];
    if (!question) return sum;
    const option = question.options?.find((item) => String(item.value) === String(value));
    return sum + Number(option?.risk || 0);
  }, 0);

  const riskScore = risks.reduce((sum, risk) => sum + risk.score, 0) + answerRisk * 0.35;
  const score = Math.max(0, Math.min(100, Math.round(100 - riskScore)));
  const answeredCount = Object.values(answers).filter((value) => String(value || "").trim() !== "").length;
  const riskLevel = score >= 80 ? "良好" : score >= 60 ? "注意" : score >= 40 ? "高风险" : "危险";
  const sortedRisks = risks.sort((a, b) => b.score - a.score);
  const topRisks = sortedRisks.slice(0, 3);
  const recommendations = topRisks.map((risk) => risk.suggestion).filter(Boolean).slice(0, 3);
  const knowledge = topRisks
    .map((risk) => window.RDPS_KNOWLEDGE?.[risk.knowledge_key])
    .filter(Boolean);

  const improvement = topRisks.length
    ? "如果先处理以上3个风险，通常可改善毛利、减少现金压力，并让老板更快看清餐厅真实赚钱能力。"
    : "目前没有明显高风险。建议继续每月追踪利润表、菜单毛利和库存盘点，保持稳定。";

  return {
    score,
    riskLevel,
    answeredCount,
    totalQuestions: 40,
    risks: sortedRisks,
    topRisks,
    recommendations,
    knowledge,
    improvement
  };
}

window.RDPS_RISK_RULES = {
  analyze: analyzeRestaurantRisk
};
