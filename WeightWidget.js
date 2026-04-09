// Weight Widget - Health Tracker
var WT_URL = "https://meshminds.app.n8n.cloud/webhook/log-weight"
var SITE_URL = "https://daemien-calories.vercel.app/#weight"
var C_BG = new Color("#0a0a0a")
var C_UP = new Color("#ff6b35")
var C_DOWN = new Color("#4ade80")
var C_MUTED = new Color("#555555")
var C_WHITE = new Color("#f0f0f0")

function loadCache() {
  try {
    if (Keychain.contains("ht_weight")) return JSON.parse(Keychain.get("ht_weight"))
  } catch(e) {}
  return {current: null, change: 0, changePercent: 0, trend: "stable"}
}

function saveCache(d) {
  try { Keychain.set("ht_weight", JSON.stringify(d)) } catch(e) {}
}

async function fetchLatestWeight() {
  try {
    var r = new Request(WT_URL)
    r.method = "POST"
    r.headers = {"Content-Type": "application/json"}
    r.body = JSON.stringify({type: "status"})
    r.timeoutInterval = 8
    var d = await r.loadJSON()
    if (d && d.current != null) {
      var data = {current: d.current, change: d.change||0, changePercent: d.changePercent||0, trend: d.trend||"stable"}
      saveCache(data)
      return data
    }
  } catch(e) {}
  return loadCache()
}

function makeWidget(d) {
  var trend = d.trend || "stable"
  var tc = trend === "up" ? C_UP : trend === "down" ? C_DOWN : C_MUTED
  var arrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "—"
  var w = new ListWidget()
  w.backgroundColor = C_BG
  w.url = SITE_URL
  w.setPadding(14, 14, 14, 14)

  // Header
  var top = w.addStack()
  top.layoutHorizontally()
  top.centerAlignContent()
  var lbl = top.addText("GEWICHT")
  lbl.font = Font.boldMonospacedSystemFont(9)
  lbl.textColor = C_MUTED
  top.addSpacer()
  var arr = top.addText(arrow)
  arr.font = Font.boldSystemFont(10)
  arr.textColor = tc

  w.addSpacer(6)

  // Current weight (big)
  var num = w.addText(d.current != null ? Number(d.current).toFixed(1) : "--")
  num.font = Font.boldSystemFont(30)
  num.textColor = C_WHITE
  num.minimumScaleFactor = 0.6

  var unit = w.addText("kg")
  unit.font = Font.mediumSystemFont(11)
  unit.textColor = C_MUTED

  w.addSpacer()

  // Tap hint
  var hint = w.addText("Tippen zum Eintragen")
  hint.font = Font.mediumSystemFont(8)
  hint.textColor = C_MUTED

  w.addSpacer(4)

  // Change stats
  var bot = w.addStack()
  bot.layoutHorizontally()
  bot.centerAlignContent()
  var ch = Number(d.change||0)
  var pc = Number(d.changePercent||0)
  var ct = bot.addText((ch>=0?"+":"")+ch.toFixed(1)+" kg")
  ct.font = Font.mediumMonospacedSystemFont(10)
  ct.textColor = tc
  bot.addSpacer()
  var pt = bot.addText((pc>=0?"+":"")+pc.toFixed(1)+"%")
  pt.font = Font.boldMonospacedSystemFont(9)
  pt.textColor = tc

  return w
}

if (config.runsInWidget) {
  var data = await fetchLatestWeight()
  Script.setWidget(makeWidget(data))
} else {
  await makeWidget(loadCache()).presentSmall()
}
Script.complete()
