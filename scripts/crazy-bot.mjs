import process from "node:process";
import { chromium } from "playwright";

function parseArgs(argv) {
  const options = {
    baseUrl: "http://127.0.0.1:3000",
    headed: false,
    pollMs: 40,
    targetTime: 90,
    testMode: true,
    screenshotPath: "bot-crazy-result.png",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--headed") {
      options.headed = true;
    } else if (arg === "--url" && next) {
      options.baseUrl = next;
      index += 1;
    } else if (arg === "--poll" && next) {
      options.pollMs = Number(next);
      index += 1;
    } else if (arg === "--target-time" && next) {
      options.targetTime = Number(next);
      index += 1;
    } else if (arg === "--screenshot" && next) {
      options.screenshotPath = next;
      index += 1;
    } else if (arg === "--no-test-mode") {
      options.testMode = false;
    }
  }

  return options;
}

function buildGameUrl(baseUrl, testMode) {
  const url = new URL(baseUrl);
  url.searchParams.set("bot", "1");
  if (testMode) {
    url.searchParams.set("test", "1");
  }
  return url.toString();
}

function getAxisNeighbors(axis, value) {
  const currentIndex = axis.indexOf(value);
  if (currentIndex === -1) {
    return [];
  }

  return [axis[currentIndex - 1], axis[currentIndex + 1]].filter(
    (candidate) => candidate !== undefined,
  );
}

function getCandidates(engine) {
  const { player, activeRows, activeCols } = engine;
  const candidates = [
    { direction: "stay", x: player.x, y: player.y },
    ...getAxisNeighbors(activeRows, player.y).map((y) => ({ direction: y < player.y ? "up" : "down", x: player.x, y })),
    ...getAxisNeighbors(activeCols, player.x).map((x) => ({ direction: x < player.x ? "left" : "right", x, y: player.y })),
  ];

  const deduped = [];
  const seen = new Set();
  for (const candidate of candidates) {
    const key = `${candidate.direction}:${candidate.x}:${candidate.y}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(candidate);
    }
  }
  return deduped;
}

function getLaserPenalty(candidate, laser) {
  const onLine = laser.isVertical ? candidate.x === laser.index : candidate.y === laser.index;
  const lineDistance = Math.abs((laser.isVertical ? candidate.x : candidate.y) - laser.index);

  if (laser.state === "FIRING") {
    return onLine ? 1e9 : 0;
  }

  if (laser.state === "REMNANT") {
    return onLine ? 40 : 0;
  }

  if (laser.state === "WARNING") {
    if (!onLine) {
      return 40 / (lineDistance + 1);
    }

    const urgency = 1 / Math.max(laser.stateTimer, 0.04);
    const base = laser.kind === "SWEEP" ? 3200 : laser.kind === "PURSUIT" ? 2600 : 2200;
    return base * urgency;
  }

  if (laser.state === "QUEUED") {
    if (!onLine) {
      return laser.kind === "PURSUIT" ? 80 / (lineDistance + 1) : 18 / (lineDistance + 1);
    }

    const urgency = 1 / Math.max(laser.stateTimer, 0.08);
    if (laser.kind === "SWEEP") {
      return 700 * urgency;
    }
    if (laser.kind === "PURSUIT") {
      return (laser.lockedOn ? 900 : 420) * urgency;
    }
    return 300 * urgency;
  }

  return 0;
}

function scoreCandidate(candidate, engine) {
  let score = 0;

  for (const laser of engine.lasers) {
    score += getLaserPenalty(candidate, laser);
  }

  const mobility = getCandidates({ ...engine, player: candidate }).length - 1;
  score -= mobility * 40;

  const centerX = engine.activeCols[Math.floor(engine.activeCols.length / 2)] ?? candidate.x;
  const centerY = engine.activeRows[Math.floor(engine.activeRows.length / 2)] ?? candidate.y;
  score += Math.abs(candidate.x - centerX) * 3 + Math.abs(candidate.y - centerY) * 3;

  if (engine.item && candidate.x === engine.item.col && candidate.y === engine.item.row) {
    score -= 35;
  }

  return score;
}

function decideDirection(state) {
  const engine = state.engine;
  if (!engine?.running) {
    return null;
  }

  const candidates = getCandidates(engine).map((candidate) => ({
    ...candidate,
    score: scoreCandidate(candidate, engine),
  }));

  candidates.sort((left, right) => left.score - right.score);
  const [best] = candidates;
  if (!best || best.direction === "stay") {
    return null;
  }

  return best.direction;
}

async function waitForBot(page) {
  await page.waitForFunction(() => typeof globalThis.__laserBot?.getState === "function");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const browser = await chromium.launch({ headless: !options.headed });
  const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
  const gameUrl = buildGameUrl(options.baseUrl, options.testMode);

  console.log(`Opening ${gameUrl}`);
  await page.goto(gameUrl, { waitUntil: "domcontentloaded" });
  await waitForBot(page);
  await page.evaluate((testMode) => globalThis.__laserBot.startCrazy({ testMode }), options.testMode);

  let lastMoveAt = 0;

  while (true) {
    const state = await page.evaluate(() => globalThis.__laserBot.getState());
    const alive = state.engine?.timeAlive ?? 0;
    const screen = state.currentScreen;

    if (screen === "GAMEOVER") {
      await page.screenshot({ path: options.screenshotPath });
      throw new Error(`Bot died at ${alive.toFixed(1)}s. Screenshot: ${options.screenshotPath}`);
    }

    if (alive >= options.targetTime) {
      await page.screenshot({ path: options.screenshotPath });
      console.log(`Success: survived to ${alive.toFixed(1)}s. Screenshot: ${options.screenshotPath}`);
      break;
    }

    const direction = decideDirection(state);
    if (direction && Date.now() - lastMoveAt >= 120) {
      await page.evaluate((moveDirection) => globalThis.__laserBot.move(moveDirection), direction);
      lastMoveAt = Date.now();
    }

    await page.waitForTimeout(options.pollMs);
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
