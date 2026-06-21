const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=rub&include_24hr_change=true";

const numberFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

function send(res, status, body, contentType = "text/plain; charset=utf-8") {
  res.statusCode = status;
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(body);
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    send(res, 405, "Method Not Allowed");
    return;
  }

  try {
    const response = await fetch(COINGECKO_URL, {
      headers: {
        accept: "application/json",
        "user-agent": "CryptoAssistantShortcut/1.0",
      },
    });

    if (!response.ok) {
      send(res, 502, `CoinGecko error: ${response.status}`);
      return;
    }

    const data = await response.json();
    const rub = data?.bitcoin?.rub;
    const change = data?.bitcoin?.rub_24h_change;

    if (typeof rub !== "number") {
      send(res, 502, "CoinGecko response did not include bitcoin.rub");
      return;
    }

    if (req.query?.format === "json") {
      send(
        res,
        200,
        JSON.stringify({
          symbol: "BTC",
          currency: "RUB",
          price: rub,
          change24h: typeof change === "number" ? change : null,
          source: "coingecko",
          updatedAt: new Date().toISOString(),
        }),
        "application/json; charset=utf-8",
      );
      return;
    }

    const lines = [`Bitcoin (BTC): ${numberFormatter.format(rub)} ₽`];
    if (typeof change === "number") {
      const sign = change >= 0 ? "+" : "-";
      lines.push(`24ч: ${sign}${percentFormatter.format(Math.abs(change))}%`);
    }

    send(res, 200, lines.join("\n"));
  } catch (error) {
    send(res, 500, `CryptoAssistant error: ${error.message}`);
  }
};
