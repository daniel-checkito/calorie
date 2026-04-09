// Calorie Widget - Health Tracker
var CAL_URL = "https://meshminds.app.n8n.cloud/webhook/227a21d7-85ea-4212-932b-21fc2245ccdb"
var SITE_URL = "https://daemien-calories.vercel.app/#calories"
var GOAL = 2700
var DAY_START = 7    // 07:00
var DAY_END   = 22   // 22:00

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

function getPace(total) {
  var now = new Date()
  var h = now.getHours() + now.getMinutes() / 60
  var dayLen = DAY_END - DAY_START
  var elapsed = Math.max(0, Math.min(h - DAY_START, dayLen))
  var paceTarget = Math.round(GOAL * elapsed / dayLen)
  var gap = total - paceTarget

  // Meal label by time
  var label
  if (h < 9)    label = "Frühstück"
  else if (h < 11)  label = "Frühstück"
  else if (h < 14)  label = "Mittagessen"
  else if (h < 17)  label = "Snack Zeit"
  else if (h < 20)  label = "Abendessen"
  else          label = "Letzter Snack"

  return {paceTarget: paceTarget, gap: gap, label: label}
}

function makeDonut(pct, done) {
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

  // Progress arc — 12 o'clock, clockwise
  var filled = Math.min(pct / 100, 1)
  if (filled > 0) {
    var arc = new Path()
    arc.addArc(new Point(cx, cy), r, -Math.PI / 2, -Math.PI / 2 + filled * Math.PI * 2, false)
    dc.addPath(arc)
    dc.setLineWidth(lw)
    dc.setStrokeColor(new Color(done ? "#4ade80" : "#c8f55a"))
    dc.strokePath()
  }

  return dc.getImage()
}

async function build() {
  var data = await getToday()
  var pct  = Math.min(data.percentage, 100)
  var done = data.goalReached
  var pace = getPace(data.total)
  var gap  = pace.gap
  var ahead = gap >= 0
  var gapStr = (ahead ? "+" : "") + gap.toLocaleString("de-DE")
  var gapColor = done ? "#4ade80" : ahead ? "#4ade80" : "#c8f55a"

  var w = new ListWidget()
  w.backgroundColor = new Color("#0a0a0a")
  w.url = SITE_URL
  w.setPadding(12, 14, 12, 14)

  // Header: KCAL + meal label
  var top = w.addStack()
  top.layoutHorizontally()
  top.centerAlignContent()
  var lbl = top.addText("KCAL")
  lbl.font = Font.boldMonospacedSystemFont(9)
  lbl.textColor = new Color("#555555")
  top.addSpacer()
  var mealTxt = top.addText(pace.label)
  mealTxt.font = Font.mediumSystemFont(9)
  mealTxt.textColor = new Color("#555555")
  mealTxt.lineLimit = 1

  w.addSpacer(2)

  // Main: donut left, numbers right
  var mid = w.addStack()
  mid.layoutHorizontally()
  mid.centerAlignContent()

  var donutStack = mid.addStack()
  donutStack.layoutVertically()
  donutStack.centerAlignContent()
  var donutImg = donutStack.addImage(makeDonut(pct, done))
  donutImg.imageSize = new Size(72, 72)

  mid.addSpacer(10)

  var numStack = mid.addStack()
  numStack.layoutVertically()

  // Logged calories (large)
  var num = numStack.addText(data.total.toLocaleString("de-DE"))
  num.font = Font.boldSystemFont(26)
  num.textColor = new Color(done ? "#4ade80" : "#f0f0f0")
  num.minimumScaleFactor = 0.7

  numStack.addSpacer(2)

  // Divider line
  var div = numStack.addText("────────")
  div.font = Font.mediumMonospacedSystemFont(7)
  div.textColor = new Color("#222222")

  numStack.addSpacer(2)

  // Pace target
  var tgtRow = numStack.addStack()
  tgtRow.layoutHorizontally()
  tgtRow.centerAlignContent()
  var tgtLbl = tgtRow.addText("ziel ")
  tgtLbl.font = Font.mediumMonospacedSystemFont(8)
  tgtLbl.textColor = new Color("#444444")
  var tgtVal = tgtRow.addText(pace.paceTarget.toLocaleString("de-DE"))
  tgtVal.font = Font.boldMonospacedSystemFont(8)
  tgtVal.textColor = new Color("#666666")

  numStack.addSpacer(3)

  // Gap: behind / on track
  var gapTxt = numStack.addText(done ? "Ziel erreicht!" : gapStr)
  gapTxt.font = Font.boldSystemFont(13)
  gapTxt.textColor = new Color(gapColor)
  gapTxt.minimumScaleFactor = 0.7

  w.addSpacer()

  // Bottom: remaining
  if (!done) {
    var bot = w.addStack()
    bot.layoutHorizontally()
    var remLbl = bot.addText("noch ")
    remLbl.font = Font.mediumMonospacedSystemFont(9)
    remLbl.textColor = new Color("#444444")
    var remVal = bot.addText(data.remaining.toLocaleString("de-DE") + " kcal")
    remVal.font = Font.boldMonospacedSystemFont(9)
    remVal.textColor = new Color("#555555")
  }

  return w
}

var widget = await build()
if (config.runsInWidget) { Script.setWidget(widget) } else { widget.presentSmall() }
Script.complete()
