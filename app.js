// Sample data — replace with real API later
const stocks = [
  {
    symbol: "005930",
    name: "삼성전자",
    price: 72800,
    change: 1.25,
    volume: "12.4M",
    long: "up",
    mid: "up",
    short: "neutral",
    rs: 0.82
  },
  {
    symbol: "009150",
    name: "삼성전기",
    price: 156500,
    change: -0.64,
    volume: "0.8M",
    long: "up",
    mid: "neutral",
    short: "down",
    rs: 0.61
  },
  {
    symbol: "000660",
    name: "SK하이닉스",
    price: 198000,
    change: 2.15,
    volume: "4.1M",
    long: "up",
    mid: "up",
    short: "up",
    rs: 0.91
  }
];

const market = {
  kospi: { value: 2654.2, change: 0.42 },
  nasdaq: { value: 18124.5, change: 0.68 },
  sox: { value: 5120.3, change: 1.12 },
  vix: 15.8
};

function render() {
  // Market
  document.getElementById("kospi").textContent = market.kospi.value.toLocaleString();
  document.getElementById("kospiChg").textContent = formatChg(market.kospi.change);
  document.getElementById("kospiChg").className = chgClass(market.kospi.change);

  document.getElementById("nasdaq").textContent = market.nasdaq.value.toLocaleString();
  document.getElementById("nasdaqChg").textContent = formatChg(market.nasdaq.change);
  document.getElementById("nasdaqChg").className = chgClass(market.nasdaq.change);

  document.getElementById("sox").textContent = market.sox.value.toLocaleString();
  document.getElementById("soxChg").textContent = formatChg(market.sox.change);
  document.getElementById("soxChg").className = chgClass(market.sox.change);

  document.getElementById("vix").textContent = market.vix.toFixed(1);

  // Regime
  const regime = getRegime();
  const badge = document.getElementById("regimeBadge");
  badge.textContent = regime.label;
  badge.className = `px-3 py-1 rounded-full text-sm font-medium ${regime.class}`;

  // Stocks
  const grid = document.getElementById("stocksGrid");
  grid.innerHTML = stocks.map(s => `
    <div class="card p-4">
      <div class="flex justify-between items-start">
        <div>
          <div class="font-semibold">${s.name}</div>
          <div class="text-xs text-gray-400">${s.symbol}</div>
        </div>
        <span class="text-xs px-2 py-0.5 rounded ${s.change >= 0 ? 'signal-buy' : 'signal-sell'}">
          ${s.change >= 0 ? '+' : ''}${s.change.toFixed(2)}%
        </span>
      </div>
      <div class="text-2xl font-bold mt-2">${s.price.toLocaleString()}</div>
      <div class="text-xs text-gray-400 mt-1">거래량 ${s.volume}</div>
      <div class="mt-3 flex gap-1 text-xs">
        <span class="px-2 py-0.5 rounded bg-gray-800">장 ${labelTF(s.long)}</span>
        <span class="px-2 py-0.5 rounded bg-gray-800">중 ${labelTF(s.mid)}</span>
        <span class="px-2 py-0.5 rounded bg-gray-800">단 ${labelTF(s.short)}</span>
      </div>
      <div class="mt-2 text-xs text-gray-400">상대강도 ${(s.rs * 100).toFixed(0)}</div>
    </div>
  `).join("");

  // Timeframe table
  document.getElementById("timeframeTable").innerHTML = `
    <table class="w-full">
      <thead class="text-gray-400 text-left">
        <tr><th class="pb-2">종목</th><th>장기</th><th>중기</th><th>단기</th><th>정렬</th></tr>
      </thead>
      <tbody>
        ${stocks.map(s => {
          const aligned = s.long === "up" && s.mid !== "down" && s.short !== "down";
          return `<tr class="border-t border-gray-800">
            <td class="py-2">${s.name}</td>
            <td>${icon(s.long)}</td>
            <td>${icon(s.mid)}</td>
            <td>${icon(s.short)}</td>
            <td class="${aligned ? 'text-green-400' : 'text-gray-500'}">${aligned ? '정렬' : '관망'}</td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>
  `;

  // Signals
  const signals = generateSignals();
  document.getElementById("signalOutput").textContent = JSON.stringify(signals, null, 2);

  document.getElementById("lastUpdate").textContent = new Date().toLocaleTimeString("ko-KR");

  drawChart();
}

function getRegime() {
  if (market.vix > 25) return { label: "위험 회피", class: "bg-red-900 text-red-200" };
  if (market.sox.change > 0.5 && market.nasdaq.change > 0) return { label: "매수 허용", class: "bg-green-900 text-green-200" };
  if (market.sox.change < -1) return { label: "매수 제한", class: "bg-orange-900 text-orange-200" };
  return { label: "관망", class: "bg-yellow-900 text-yellow-200" };
}

function generateSignals() {
  const regime = getRegime();
  const allowBuy = regime.label === "매수 허용";

  return stocks.map(s => {
    const aligned = s.long === "up" && s.mid !== "down";
    let action = "hold";
    let reason = "국면 또는 정렬 부족";
    let confidence = 0.3;

    if (allowBuy && aligned && s.rs > 0.7) {
      action = "buy";
      reason = "국면 통과 + 타임프레임 정렬 + 상대강도 우위";
      confidence = Math.min(0.85, 0.5 + s.rs * 0.3);
    } else if (s.short === "down" && s.mid === "down") {
      action = "sell";
      reason = "단기·중기 하락 정렬";
      confidence = 0.65;
    }

    return {
      symbol: s.symbol,
      name: s.name,
      action,
      confidence: Number(confidence.toFixed(2)),
      size: action === "buy" ? 0.3 : 0,
      reason
    };
  });
}

function drawChart() {
  const ctx = document.getElementById("relativeChart").getContext("2d");
  if (window._chart) window._chart.destroy();
  window._chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: stocks.map(s => s.name),
      datasets: [{
        label: "상대강도",
        data: stocks.map(s => s.rs * 100),
        backgroundColor: ["#3b82f6", "#6366f1", "#22c55e"]
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { color: "#94a3b8" }, grid: { color: "#2a2e3a" } },
        x: { ticks: { color: "#94a3b8" }, grid: { display: false } }
      }
    }
  });
}

function formatChg(v) { return (v >= 0 ? "+" : "") + v.toFixed(2) + "%"; }
function chgClass(v) { return v >= 0 ? "positive" : "negative"; }
function labelTF(t) { return t === "up" ? "↑" : t === "down" ? "↓" : "→"; }
function icon(t) { return t === "up" ? '<span class="text-green-400">↑</span>' : t === "down" ? '<span class="text-red-400">↓</span>' : '<span class="text-gray-400">→</span>'; }

function copySignals() {
  const text = document.getElementById("signalOutput").textContent;
  navigator.clipboard.writeText(text);
}

render();
