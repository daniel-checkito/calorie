// Calorie Widget - Health Tracker
var CAL_URL = "https://meshminds.app.n8n.cloud/webhook/227a21d7-85ea-4212-932b-21fc2245ccdb"
var SITE_URL = "https://daemien-calories.vercel.app/#calories"
var GOAL = 2700

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

function getMealStatus(total) {
  var h = new Date().getHours() + new Date().getMinutes() / 60
  var pct = total / GOAL
  if (h < 9.5)  return {text: "Guten Morgen", ok: true}
  if (h < 11)   return {text: pct < 0.12 ? "Frühstück!" : "✓ Frühstück", ok: pct >= 0.12}
  if (h < 13)   return {text: pct < 0.35 ? "Mittagessen?" : "✓ Mittag", ok: pct >= 0.3}
  if (h < 15.5) return {text: pct < 0.50 ? "Snack?" : "✓ On Track", ok: pct >= 0.45}
  if (h < 16.5) return {text: pct < 0.55 ? "Snack Zeit!" : "✓ Snack", ok: pct >= 0.5}
  if (h < 20)   return {text: pct < 0.70 ? "Bleib dran!" : "✓ Super", ok: pct >= 0.65}
  if (h < 21)   return {text: pct < 0.88 ? "Abendessen?" : "✓ Fast da!", ok: pct >= 0.85}
  return {text: pct >= 1 ? "✓ Erreicht!" : "Guter Tag!", ok: pct >= 0.9}
}

function makeDonut(pct, total, done) {
  var s = 120
  var dc = new DrawContext()
  dc.size = new Size(s, s)
  dc.opaque = false
  dc.respectScreenScale = true
  var cx = s / 2, cy = s / 2, r = 44, lw = 11

  // Background ring
  var bgPath = new Path()
  bgPath.addArc(new Point(cx, cy), r, 0, Math.PI * 2, false)
  dc.addPath(bgPath)
  dc.setLineWidth(lw)
  dc.setStrokeColor(new Color("#1e1e1e"))
  dc.strokePath()

  // Progress arc — starts at 12 o'clock, goes clockwise
  var filled = Math.min(pct / 100, 1)
  if (filled > 0) {
    var arc = new Path()
    arc.addArc(new Point(cx, cy), r, -Math.PI / 2, -Math.PI / 2 + filled * Math.PI * 2, false)
    dc.addPath(arc)
    dc.setLineWidth(lw)
    dc.setStrokeColor(new Color(done ? "#4ade80" : "#c8f55a"))
    dc.strokePath()
  }

  // Center: calorie number
  dc.setTextAlignedCenter()
  dc.setTextColor(new Color(done ? "#4ade80" : "#f0f0f0"))
  dc.setFont(Font.boldSystemFont(20))
  dc.drawTextInRect(total.toLocaleString("de-DE"), new Rect(4, cy - 14, s - 8, 26))

  // Center: "kcal" unit
  dc.setTextColor(new Color("#555555"))
  dc.setFont(Font.mediumSystemFont(10))
  dc.drawTextInRect("kcal", new Rect(0, cy + 12, s, 16))

  return dc.getImage()
}

async function build() {
  var data = await getToday()
  var pct = Math.min(data.percentage, 100)
  var done = data.goalReached
  var meal = getMealStatus(data.total)

  var w = new ListWidget()
  w.backgroundColor = new Color("#0a0a0a")
  w.url = SITE_URL
  w.setPadding(12, 14, 12, 14)

  // Header: label + meal status
  var top = w.addStack()
  top.layoutHorizontally()
  top.centerAlignContent()
  var lbl = top.addText("KCAL")
  lbl.font = Font.boldMonospacedSystemFont(9)
  lbl.textColor = new Color("#555555")
  top.addSpacer()
  var mealTxt = top.addText(meal.text)
  mealTxt.font = Font.mediumSystemFont(9)
  mealTxt.textColor = new Color(meal.ok ? "#4ade80" : "#c8f55a")
  mealTxt.lineLimit = 1
  mealTxt.minimumScaleFactor = 0.7

  w.addSpacer(4)

  // Donut chart (centered)
  var imgRow = w.addStack()
  imgRow.layoutHorizontally()
  imgRow.addSpacer()
  var img = imgRow.addImage(makeDonut(pct, data.total, done))
  img.imageSize = new Size(100, 100)
  imgRow.addSpacer()

  w.addSpacer()

  // Bottom: remaining + percentage
  var bot = w.addStack()
  bot.layoutHorizontally()
  bot.centerAlignContent()
  if (done) {
    var dt = bot.addText("Ziel erreicht!")
    dt.font = Font.mediumSystemFont(9)
    dt.textColor = new Color("#4ade80")
  } else {
    var rt = bot.addText("-" + data.remaining.toLocaleString("de-DE"))
    rt.font = Font.mediumMonospacedSystemFont(10)
    rt.textColor = new Color("#f0f0f0")
    bot.addSpacer()
    var pt = bot.addText(Math.round(pct) + "%")
    pt.font = Font.boldMonospacedSystemFont(9)
    pt.textColor = new Color("#555555")
  }

  return w
}

var widget = await build()
if (config.runsInWidget) { Script.setWidget(widget) } else { widget.presentSmall() }
Script.complete()
