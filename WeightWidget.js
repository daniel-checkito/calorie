// Weight Widget - Health Tracker
var WT_URL = "https://meshminds.app.n8n.cloud/webhook/34673c88-0335-4e98-96f6-1fa96d74a10c"
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
async function sendWeight(kg) {
  var r = new Request(WT_URL)
  r.method = "POST"
  r.headers = {"Content-Type": "application/json"}
  r.body = JSON.stringify({weight: kg})
  r.timeoutInterval = 10
  var res = await r.loadJSON()
  if (res.success) saveCache({current: res.current, change: res.change, changePercent: res.changePercent, trend: res.trend})
  return res
}
function makeWidget(d) {
  var trend = d.trend || "stable"
  var tc = trend === "up" ? C_UP : trend === "down" ? C_DOWN : C_MUTED
  var arrow = trend === "up" ? "^" : trend === "down" ? "v" : "-"
  var w = new ListWidget()
  w.backgroundColor = C_BG
  w.url = SITE_URL
  w.setPadding(14, 14, 14, 14)
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
  var num = w.addText(d.current != null ? Number(d.current).toFixed(1) : "--")
  num.font = Font.boldSystemFont(30)
  num.textColor = C_WHITE
  num.minimumScaleFactor = 0.6
  var unit = w.addText("kg")
  unit.font = Font.mediumSystemFont(11)
  unit.textColor = C_MUTED
  w.addSpacer()
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
async function askWeight() {
  var a = new Alert()
  a.title = "Gewicht eingeben"
  a.message = "kg"
  a.addTextField("78.5", "")
  a.addAction("Speichern")
  a.addCancelAction("Abbrechen")
  var i = await a.presentAlert()
  if (i === -1) return null
  var v = parseFloat(a.textFieldValue(0))
  if (!v || v < 20 || v > 300) return null
  return v
}
if (config.runsInWidget) {
  Script.setWidget(makeWidget(loadCache()))
} else {
  var kg = await askWeight()
  if (kg) { await sendWeight(kg) }
  await makeWidget(loadCache()).presentSmall()
}
Script.complete()
