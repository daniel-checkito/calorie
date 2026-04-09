// Calorie Widget - Health Tracker
var CAL_URL = "https://meshminds.app.n8n.cloud/webhook/227a21d7-85ea-4212-932b-21fc2245ccdb"
var SITE_URL = "https://daemien-calories.vercel.app/#calories"
var GOAL = 2700
var C_BG = new Color("#0a0a0a")
var C_ACCENT = new Color("#c8f55a")
var C_GREEN = new Color("#4ade80")
var C_MUTED = new Color("#555555")
var C_WHITE = new Color("#f0f0f0")
async function getToday() {
  try {
    var r = new Request(CAL_URL)
    r.method = "POST"
    r.headers = {"Content-Type": "application/json"}
    r.body = JSON.stringify({type: "status"})
    r.timeoutInterval = 8
    var d = await r.loadJSON()
    return {total: d.total||0, remaining: d.remaining||GOAL, percentage: d.percentage||0, goalReached: d.goalReached||false}
  } catch(e) {
    return {total: 0, remaining: GOAL, percentage: 0, goalReached: false}
  }
}
async function build() {
  var data = await getToday()
  var pct = Math.min(data.percentage, 100)
  var w = new ListWidget()
  w.backgroundColor = C_BG
  w.url = SITE_URL
  w.setPadding(14, 14, 14, 14)
  var top = w.addStack()
  top.layoutHorizontally()
  top.centerAlignContent()
  var lbl = top.addText("KCAL")
  lbl.font = Font.boldMonospacedSystemFont(9)
  lbl.textColor = C_MUTED
  top.addSpacer()
  var dot = top.addText(data.goalReached ? "*" : "o")
  dot.font = Font.boldSystemFont(8)
  dot.textColor = data.goalReached ? C_GREEN : C_MUTED
  w.addSpacer(6)
  var num = w.addText(data.total.toLocaleString("de-DE"))
  num.font = Font.boldSystemFont(30)
  num.textColor = data.goalReached ? C_GREEN : C_ACCENT
  num.minimumScaleFactor = 0.6
  w.addSpacer()
  var bot = w.addStack()
  bot.layoutHorizontally()
  bot.centerAlignContent()
  if (data.goalReached) {
    var dt = bot.addText("Ziel erreicht!")
    dt.font = Font.mediumSystemFont(9)
    dt.textColor = C_GREEN
  } else {
    var rt = bot.addText("-" + data.remaining.toLocaleString("de-DE"))
    rt.font = Font.mediumMonospacedSystemFont(10)
    rt.textColor = C_WHITE
    bot.addSpacer()
    var pt = bot.addText(pct + "%")
    pt.font = Font.boldMonospacedSystemFont(9)
    pt.textColor = C_MUTED
  }
  return w
}
var widget = await build()
if (config.runsInWidget) { Script.setWidget(widget) } else { widget.presentSmall() }
Script.complete()
