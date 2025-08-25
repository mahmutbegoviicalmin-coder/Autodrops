/*
  Winning Products AI Agent (CJ + Google Trends + optional SerpAPI)
  - Refresh svakih 72h
  - Maks 20 aktivnih winning proizvoda
  - Snima rezultate u winning_products.json

  ENV (optional):
    CJ_PROXY_BASE=http://localhost:3001/cj
    SERPAPI_KEY=...
*/

/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
let googleTrends;
try { googleTrends = require('google-trends-api'); } catch { googleTrends = null; }
require('dotenv').config();

const CJ_BASE = process.env.CJ_PROXY_BASE || 'http://localhost:3001/cj';
const SERPAPI_KEY = process.env.SERPAPI_KEY || '';
const OUT_FILE = path.resolve(process.cwd(), 'winning_products.json');
const REFRESH_MS = 72 * 60 * 60 * 1000; // 72h

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function cjList(pageNum = 1, pageSize = 50, searchText = '') {
  const url = `${CJ_BASE}/product/list`;
  const params = { pageNum, pageSize, productNameEn: searchText || undefined };
  const { data } = await axios.get(url, { params });
  const list = data?.data?.list || [];
  return list;
}

async function cjComments(pid) {
  try {
    const url = `${CJ_BASE}/product/productComments`;
    const { data } = await axios.get(url, { params: { pid, pageNum: 1, pageSize: 20 } });
    const avg = Number(data?.data?.averageScore || 0);
    return isFinite(avg) ? avg : 0;
  } catch {
    return 0;
  }
}

async function fetchTrendsScore(keyword) {
  if (!googleTrends) return { score: 0, growthPct: 0 };
  try {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - 30);
    const endTime = new Date();
    const res = await googleTrends.interestOverTime({ keyword, startTime, endTime });
    const series = JSON.parse(res)?.default?.timelineData || [];
    if (!series.length) return { score: 0, growthPct: 0 };
    const values = series.map(p => Number(p.value?.[0] || 0));
    const score = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const avgA = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
    const avgB = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);
    const growthPct = avgA > 0 ? Math.round(((avgB - avgA) / avgA) * 100) : 0;
    return { score, growthPct };
  } catch (e) {
    console.warn('trends error', e.message);
    return { score: 0, growthPct: 0 };
  }
}

async function fetchAvgMarketPrice(query) {
  if (!SERPAPI_KEY) return null; // optional
  try {
    const { data } = await axios.get('https://serpapi.com/search.json', {
      params: { engine: 'google_shopping', q: query, api_key: SERPAPI_KEY }
    });
    const items = data?.shopping_results || [];
    const prices = items
      .map(i => (i.price && Number(String(i.price).replace(/[^\d.]/g, ''))) || 0)
      .filter(n => n > 0);
    if (!prices.length) return null;
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    return Number(avg.toFixed(2));
  } catch (e) {
    console.warn('serpapi error', e.message);
    return null;
  }
}

function computeProfitMargin(cjCost, marketPrice) {
  const sell = marketPrice && marketPrice > cjCost ? marketPrice : cjCost * 2.5;
  return Math.round(((sell - cjCost) / sell) * 100);
}

function scoreProduct({ growthPct, trendsScore, rating, profitMargin }) {
  // 40% growth, 30% trends score (scaled 0..100), 15% rating (scaled 0..5), 15% profit
  const sGrowth = Math.max(0, Math.min(100, growthPct));
  const sTrends = Math.max(0, Math.min(100, trendsScore));
  const sRating = Math.max(0, Math.min(5, rating));
  const sProfit = Math.max(0, Math.min(100, profitMargin));
  const final = sGrowth * 0.4 + sTrends * 0.3 + (sRating / 5) * 100 * 0.15 + sProfit * 0.15;
  return Math.round(final);
}

async function collectPool() {
  const seen = new Set();
  const pool = [];
  for (let page = 1; page <= 5 && pool.length < 120; page++) {
    const list = await cjList(page, 50);
    if (!list.length) break;
    for (const it of list) {
      const pid = it.pid;
      if (!pid || seen.has(pid)) continue;
      seen.add(pid);
      pool.push(it);
      if (pool.length >= 150) break;
    }
    await sleep(300);
  }
  return pool;
}

async function buildCandidates(items) {
  const out = [];
  for (const it of items) {
    const pid = it.pid;
    const title = it.productNameEn || it.productName || 'Unknown';
    const cjCost = Number(it.sellPrice || 0);
    const rating = await cjComments(pid);
    const { score: trendsScore, growthPct } = await fetchTrendsScore(title);
    const market = await fetchAvgMarketPrice(title);
    const profitMargin = computeProfitMargin(cjCost, market);

    // Filter rules
    if (growthPct < 20) continue;
    if (trendsScore < 60) continue;
    if (rating < 4.5) continue;
    if (profitMargin < 30) continue;

    const thumb = it.productImage;
    const orderCount = Number(it.listedNum || 0); // proxy for popularity if true orders nisu dostupni
    const status = trendsScore >= 60 && growthPct >= 0 ? 'trending' : 'dropping';
    const avgMarket = market ?? Number((cjCost * 2.2).toFixed(2));

    const product = {
      product_name: title,
      cj_price: Number(cjCost.toFixed(2)),
      avg_market_price: avgMarket,
      profit_margin: profitMargin,
      order_count: orderCount,
      order_growth_%: growthPct,
      google_trends_score: trendsScore,
      thumbnail_url: thumb,
      status,
      _score: scoreProduct({ growthPct, trendsScore, rating, profitMargin }),
    };
    out.push(product);
    await sleep(200);
  }
  return out;
}

async function runAgent() {
  console.log('🔎 Agent: collecting pool...');
  const pool = await collectPool();
  console.log(`📦 Pool size: ${pool.length}`);
  const candidates = await buildCandidates(pool);
  console.log(`✅ Candidates: ${candidates.length}`);

  // Sort by _score desc and cap 20
  candidates.sort((a, b) => b._score - a._score);
  const top = candidates.slice(0, 20).map(({ _score, ...rest }) => rest);

  fs.writeFileSync(OUT_FILE, JSON.stringify(top, null, 2));
  console.log(`💾 Saved ${top.length} winners to ${OUT_FILE}`);
}

async function main() {
  await runAgent();
  setInterval(runAgent, REFRESH_MS);
}

if (require.main === module) {
  main().catch(err => {
    console.error('Agent failed:', err);
    process.exit(1);
  });
}


