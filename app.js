const COINS = [
  'bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana',
  'ripple', 'usd-coin', 'cardano', 'dogecoin', 'avalanche-2',
];

const API_URL =
  'https://api.coingecko.com/api/v3/coins/markets' +
  '?vs_currency=usd' +
  '&ids=' + COINS.join(',') +
  '&order=market_cap_desc' +
  '&per_page=10&page=1' +
  '&sparkline=false' +
  '&price_change_percentage=24h';

const POLL_INTERVAL = 10_000;

const tbody       = document.getElementById('coin-table');
const lastUpdated = document.getElementById('last-updated');
const errorBanner = document.getElementById('error-banner');

let prevPrices = {};

function fmt(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return '$' + (n / 1e6).toFixed(2) + 'M';
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPrice(n) {
  if (n === null || n === undefined) return '—';
  if (n < 0.01) return '$' + n.toFixed(6);
  if (n < 1)    return '$' + n.toFixed(4);
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function flash(row, direction) {
  row.classList.remove('flash-green', 'flash-red');
  // Force reflow so removing+re-adding triggers the animation
  void row.offsetWidth;
  row.classList.add(direction === 'up' ? 'flash-green' : 'flash-red');
}

function renderRow(coin, rank) {
  const change = coin.price_change_percentage_24h;
  const changeClass = change >= 0 ? 'up' : 'down';
  const changeSign  = change >= 0 ? '+' : '';

  return `
    <td class="rank">${rank}</td>
    <td>
      <div class="coin-cell">
        <img class="coin-icon" src="${coin.image}" alt="${coin.name}" loading="lazy" />
        <span class="coin-name">${coin.name}</span>
        <span class="coin-symbol">${coin.symbol}</span>
      </div>
    </td>
    <td class="right price">${fmtPrice(coin.current_price)}</td>
    <td class="right change ${changeClass}">${changeSign}${change !== null ? change.toFixed(2) : '—'}%</td>
    <td class="right muted-num hide-sm">${fmt(coin.market_cap)}</td>
    <td class="right muted-num hide-sm">${fmt(coin.total_volume)}</td>
  `;
}

async function fetchPrices() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const coins = await res.json();

    errorBanner.classList.add('hidden');

    coins.forEach((coin, i) => {
      const rank = i + 1;
      let row = document.getElementById(`row-${coin.id}`);

      if (!row) {
        row = document.createElement('tr');
        row.id = `row-${coin.id}`;
        tbody.appendChild(row);
      }

      // Remove initial loading row on first successful fetch
      const skeleton = tbody.querySelector('.skeleton-row');
      if (skeleton) skeleton.remove();

      const prev = prevPrices[coin.id];
      row.innerHTML = renderRow(coin, rank);

      if (prev !== undefined && prev !== coin.current_price) {
        flash(row, coin.current_price > prev ? 'up' : 'down');
      }

      prevPrices[coin.id] = coin.current_price;
    });

    lastUpdated.textContent = 'Last updated: ' + new Date().toLocaleTimeString();
  } catch (err) {
    errorBanner.textContent = 'Failed to fetch prices — ' + err.message + '. Retrying in 10s.';
    errorBanner.classList.remove('hidden');
  }
}

fetchPrices();
setInterval(fetchPrices, POLL_INTERVAL);
