class Progress {
	constructor(div, animation = 400) {
		this.div = document.getElementById(div)
		this.animation = animation
	}
	load(days, workDays) {
		this.progs = []
		this.days = days
		this.div.style.display = "flex"
		this.div.style.margin = "12px -4px"
		this.weeks = days / workDays
		this.workDays = workDays
		for (let i = 0; i < this.weeks; i++) {
			let bar = document.createElement("div")
			var wrapper = document.createElement("div")
			bar.style.height = "100%"
			bar.style.background = "#EEE"
			bar.style.width = "0"
			bar.style.transition = `all ${this.animation}ms`
			bar.classList.add("bar")
			wrapper.appendChild(bar)
			wrapper.style.position = "relative"
			wrapper.style.height = "14px"
			wrapper.style.background = "#EEE6"
			wrapper.style.borderRadius = "24px"
			wrapper.style.overflow = "hidden"
			wrapper.style.margin = "0 4px"
			wrapper.style.width = "100%"
			this.div.appendChild(wrapper)
		}
	}
	set(passed) {
		let bars = this.div.getElementsByClassName("bar")
		for (let i = 0; i < this.weeks; i++) {
			let prog = 100 * (passed - i * this.workDays) / this.workDays
			if (prog >= 100) prog = 100
			if (bars[i].style.width == "100%") continue
			if (prog <= 0) break 
			setTimeout(function() {
				if (prog >= 100) {
					bars[i].style.background = "#AFA"
				}
				bars[i].style.width = `${prog}%`
			}, this.animation * i)
		}
	}
}


// Date helpers
function parseDate(str) {
	let e = str.split("-")
	return new Date(e[0], e[1] - 1, e[2])
}

function dateDelta(date1, date2) {
	return Math.abs(parseDate(date1) - parseDate(date2)) / 3600 / 24 / 1000
}

function getDate() {
	let date = new Date()
	let d = date.getDate()
	let m = date.getMonth() + 1
	let y = date.getFullYear()
	return `${y}-${m}-${d}`
}


// Time helpers
function parseTime(str) {
	let e = str.split(":")
	let h = parseInt(e[0])
	let m = parseInt(e[1])
	let s = 0
	if (e.length == 3) s = e[2]
	m += h * 60
	m += s / 60
	return m
}

function timeDelta(date1, date2) {
	return Math.abs(date1 - date2)
}

function getTime() {
	let date = new Date()
	let h = date.getHours()
	let m = date.getMinutes()
	let s = date.getSeconds()
	return `${h}:${m}:${s}`
}

function mkTime(minutes) {
	let h = Math.floor(minutes / 60)
	let m = Math.floor(minutes % 60)
	let s = Math.round(minutes % 1 * 60)
	if (h == 0) return `${m}m ${s}s`
	return `${h}h ${m}m ${s}s`
}


// DOM helpers
function get(div) {
	return document.getElementById(div)
}

function set(div, val) {
	if (!(div instanceof HTMLElement)) div = get(div)
	div.innerHTML = val
}


// UI helpers
function fancy_pp(pp) {
	let e = pp.toString().split(".")
	let dotstuff = "0"
	if (e.length > 1) dotstuff = e[1]
	return Math.floor(pp) + `<b>.${dotstuff}%</b>`
}

function set_lesson_box(node, name, text, progress, fixed) {
	let n_name = node.getElementsByClassName("title")[0]
	let n_text = node.getElementsByClassName("countdown")[0]
	let n_pp = node.getElementsByClassName("pp")[0]
	let n_bar = node.getElementsByClassName("progbar")[0].getElementsByTagName("div")[0]
	set(n_name, name)
	set(n_text, text)
	set(n_pp, fancy_pp(progress.toFixed(fixed)))
	n_bar.style.width = `${progress}%`
}


// Data handlers
function getCurrentLesson() {
	let timetable = Object.values(data.timetable)
	let e = timetable[parseDate(getDate()).getDay()]
	for (lesson of e) {
		let starts = parseTime(lesson.starts)
		let ends = parseTime(lesson.ends)
		let now = parseTime(getTime())
		if (starts <= now && now < ends) {
			let duration = timeDelta(starts, ends)
			let passed = now - starts
			lesson.progress = 100 * passed / duration
			return lesson
		}
	}
	return false
}
function getProgresses() {
	let delta = dateDelta(data.config.startDate, data.config.endDate)
	let today = parseDate(getDate())
	let now = parseTime(getTime())
	let timetable = Object.values(data.timetable)
	let results = {}
	let day = 0
	let currentLesson = false

	let todayProgress = {
		total: 0,
		totalMinutes: 0,
		passed: 0,
		passedMinutes: 0
	}
	let allTime = {
		passed: 0,
		total: 0,
		daysTotal: 0,
		daysPassed: 0
	}

	
	// Loop all countdown days
	while (day <= delta) {
		let date = new Date(parseDate(data.config.startDate).getTime() + day * 24 * 3600 * 1000)
		day++
		let lessons = timetable[date.getDay()]
		let freeday = false
		for (d of data.config.freeDays) {
			if (date.getTime() == parseDate(d).getTime()) {
				freeday = true
				break
			}
		}
		if (!lessons.length || freeday) continue

		// Calculate total time spent at school
		let first = parseTime(lessons[0].starts)
		let last = parseTime(lessons[lessons.length - 1].ends)
		let timeAtSchool = timeDelta(first, last)
		allTime.total += timeAtSchool
		allTime.daysTotal++
		if (date.getTime() < today.getTime()) {
			allTime.daysPassed++
			allTime.passed += timeAtSchool
		}
		else if (date.getTime() == today.getTime()) {
			let e = timeAtSchool
			if (now < last && now > first) e = parseTime(getTime()) - first
			else if (now > last) allTime.daysPassed++
			allTime.passed += e
		}

		// Cycle whole day, lesson by lesson
		for (lesson of lessons) {
			if (lesson.name.startsWith("*")) continue
			let timedelta = timeDelta(parseTime(lesson.starts), parseTime(lesson.ends))

			if (!results[lesson.name]) {
				results[lesson.name] = {
					total: 0,
					passed: 0,
					totalMinutes: 0,
					passedMinutes: 0
				}
			}
			results[lesson.name].total += 1
			results[lesson.name].totalMinutes += timedelta

			// Lessons from past days
			if (date.getTime() < today.getTime()) {
				results[lesson.name].passed += 1
				results[lesson.name].passedMinutes += timedelta
			}

			// Lessons today
			else if (date.getTime() == today.getTime()) {
				let start = parseTime(lesson.starts)
				let end = parseTime(lesson.ends)
				let now = parseTime(getTime())
				todayProgress.total += 1
				todayProgress.totalMinutes += timedelta

				// Passed lessons
				if (end <= now) {
					results[lesson.name].passed += 1
					todayProgress.passed += 1
					results[lesson.name].passedMinutes += timedelta
					todayProgress.passedMinutes += timedelta
				}

				// Current lesson
				else if (now < end && now >= start) {
					currentLesson = getCurrentLesson()
					if (currentLesson) {
						let part = currentLesson.progress / 100
						results[lesson.name].passed += part
						todayProgress.passed += part
						results[lesson.name].passedMinutes += part * timedelta
						todayProgress.passedMinutes += part * timedelta
					}
				}
			}
		}
	}

	// Sum it up
	let overview = {
		total: 0,
		passed: 0,
		totalMinutes: 0,
		passedMinutes: 0
	}

	// Detect current lesson with name starting with '*'
	if (!currentLesson) {
		currentLesson = getCurrentLesson()
		if (currentLesson) currentLesson.name = currentLesson.name.slice(1)
	}

	for (subject of Object.values(results)) {
		overview.total += subject.total
		overview.passed += subject.passed
		overview.totalMinutes += subject.totalMinutes
		overview.passedMinutes += subject.passedMinutes
	}

	// Count days when having lessons
	let workDays = 0
	for (day in data.timetable) {
		let e = data.timetable[day].length
		if (e) workDays++
	}

	return {overview, results, currentLesson, todayProgress, allTime, workDays}
}


// Main progress bar
let mainBar = new Progress("mainBar")


// Load config and initiate countdown
let xhr = new XMLHttpRequest()
xhr.open("GET", "config.json")
xhr.onload = load
xhr.send()

let data, total_days;
function load() {
	data = JSON.parse(this.responseText)
	let progs = getProgresses()
	mainBar.load(progs.allTime.daysTotal, progs.workDays)
	setInterval(runner, 1000)
	runner()
	let dedline = parseDate(data.config.endDate)
	set("till-date", dedline.toLocaleString('en', { day: "numeric", month: "long", year: "numeric" }))
}


// Countdown service
function runner() {
	let progresses = getProgresses()
	let day_passed = progresses.todayProgress.passedMinutes / progresses.todayProgress.totalMinutes
	if (isNaN(day_passed) | day_passed == 1) day_passed = 0
	let days_passed = progresses.allTime.daysPassed + day_passed
	let total_days = progresses.allTime.daysTotal

	// Main progress bar & info
	let percent_passed = (100 * days_passed / total_days).toFixed(3)
	if (percent_passed > 100) percent_passed = (100).toFixed(1)
	mainBar.set(days_passed)
	set("pp-main", fancy_pp(percent_passed))

	set("lessons-left", Math.floor(progresses.overview.total - progresses.overview.passed))
	set("lessons-time-left", mkTime(progresses.overview.totalMinutes - progresses.overview.passedMinutes))
	set("days-left", Math.round(progresses.allTime.daysTotal - progresses.allTime.daysPassed))
	set("days-time-left", mkTime(progresses.allTime.total - progresses.allTime.passed))

	// Current lesson
	let current_div = get("current_lesson")
	if (progresses.currentLesson) {
		current_div.classList.remove("hidden")
		let timedelta = timeDelta(parseTime(progresses.currentLesson.starts), parseTime(progresses.currentLesson.ends))
		set_lesson_box(
			current_div.getElementsByClassName("lesson")[0],
			progresses.currentLesson.name,
			`Time left: ${mkTime(timedelta * (100 - progresses.currentLesson.progress) / 100)}`,
			progresses.currentLesson.progress,
			1
		)
	}
	else current_div.classList.add("hidden")

	// Bad lessons list
	let container = document.getElementsByClassName("bad_lessons")[0]
	if (container.innerHTML == "") {
		for (lesson of data.config.badLessons) {
			let r = progresses.results[lesson]
			container.innerHTML += `
				<div class="lesson" subject="${lesson}">
					<div class="name">
						<div class="title">${lesson}</div>
						<div class="countdown"></div>
					</div>
					<div class="progbar"><div></div></div>
					<div class="pp"></div>
				</div>`
		}
	}
	let items = container.getElementsByClassName("lesson")
	for (item of items) {
		let subject = item.getAttribute("subject")
		let r = progresses.results[subject]
		set_lesson_box(
			item,
			subject,
			`Lessons left: ${Math.floor(r.total - r.passed)}<br>${mkTime(r.totalMinutes - r.passedMinutes)}`,
			100 * r.passed / r.total,
			2
		)
	}
}
