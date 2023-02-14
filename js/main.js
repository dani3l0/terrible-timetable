class Progress {
	constructor(div, animation = 400) {
		this.div = document.getElementById(div)
		this.animation = animation
	}
	load(weeks) {
		this.progs = []
		this.div.style.display = "flex"
		this.div.style.margin = "12px -4px"
		this.weeks = weeks
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
	set(weeks_passed) {
		let bars = this.div.getElementsByClassName("bar")
		for (let i = 0; i < this.weeks; i++) {
			let prog = 100 * weeks_passed
			if (prog >= 100) prog = 100
			weeks_passed--
			if (weeks_passed < 0) weeks_passed = 0
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


// Map builder
function getMap() {
	let delta = dateDelta(data.config.startDate, data.config.endDate)
	let today = parseDate(getDate())
	let timetable = Object.values(data.timetable)
	let day = 0

	// Day counter
	let summary = {
		daysPassed: 0,
		daysTotal: 0,
		minutesPassed: 0,
		minutesTotal: 0,
		lessonMinutesPassed: 0,
		lessonMinutesTotal: 0,
		lessonsPassed: 0,
		lessonsTotal: 0
	}

	// List containing weeks containing all lessons per week
	let map = []

	// Temporary week map
	let tmp_map = []

	// Loop all countdown days
	while (day <= delta) {
		let d = new Date(parseDate(data.config.startDate).getTime() + day * 24 * 3600 * 1000)
		day++
		let lessons = timetable[d.getDay()]
		if (d.getDay() == 0) {
			if (tmp_map) map.push(tmp_map)
			tmp_map = []
		}

		// Detect free days, and skip all lessons during those days
		let freeday = false
		for (e of data.config.freeDays) {
			if (d.getTime() == parseDate(e).getTime()) {
				freeday = true
				break
			}
		}
		if (!lessons.length || freeday) continue

		// School days counter
		summary.daysTotal++
		if (d.getTime() < today.getTime()) summary.daysPassed++

		// Let's create a lessons objects
		for (lesson of lessons) {
			let name = lesson.name
			let starts = parseTime(lesson.starts)
			let ends = parseTime(lesson.ends)
			let isLesson = !lesson.name.startsWith("*")
			if (!isLesson) name = name.slice(1)
			let duration = timeDelta(starts, ends)
			let passed = 0
			let now = false

			summary.lessonsTotal += isLesson
			summary.minutesTotal += duration
			summary.lessonMinutesTotal += duration * isLesson

			// Today lessons
			if (d.getTime() == today.getTime()) {
				let p = (parseTime(getTime()) - starts) / duration
				if (p < 0) p = 0
				else if (p > 1) p = 1
				if (p !== 0) {
					now = p !== 1
					passed = p
					summary.lessonsPassed += isLesson * p
					summary.minutesPassed += duration * p
					summary.lessonMinutesPassed += duration * p * isLesson
				}
			}

			// Finished lessons
			else if (today > d) {
				passed = 1
				summary.lessonsPassed += isLesson
				summary.minutesPassed += duration
				summary.lessonMinutesPassed += duration * isLesson
			}

			tmp_map.push({name, duration, passed, isLesson, now})
		}
	}


	return {map, summary}
}


// Per-subject organizer
function mapInterpreter(map = getMap()) {
	let subjects = {}
	let now = null
	for (week of map.map) {
		for (lesson of week) {
			let name = lesson.name

			if (!subjects[name]) subjects[name] = {
				total: 0,
				passed: 0,
				minutesTotal: 0,
				minutesPassed: 0
			}

			subjects[name].total++
			subjects[name].passed += lesson.passed
			subjects[name].minutesTotal += lesson.duration
			subjects[name].minutesPassed += lesson.duration * lesson.passed

			if (lesson.now) now = lesson
		}
	}
	return {subjects, now}
}


// Themes engine

let tsTimeout = null
function hideThemeSelector() {
	if (tsTimeout) {
		clearTimeout(tsTimeout)
		tsTimeout = null
	}
	tsTimeout = setTimeout(() => {
		get("theme-select").classList.add("above")
	}, 4000)
}

function showThemeSelector() {
	get("theme-select").classList.toggle("above");
	hideThemeSelector()
}

function setTheme(themeName) {
	if (!themeName) themeName = "default"
	let t = get("theme")
	t.className = ""
	t.classList.add(themeName)
	hideThemeSelector()
	try {
		localStorage.setItem("theme", themeName);
	}
	catch (e) {}
}



// Main progress bar
let mainBar = new Progress("mainBar", animation = 440)


// Load config and initiate countdown
let xhr = new XMLHttpRequest()
xhr.open("GET", "config.json")
xhr.onload = load
xhr.send()

let data, total_days
function load() {
	// Load config
	data = JSON.parse(this.responseText)
	let map = getMap()
	mainBar.load(map.map.length)
	setInterval(runner, 1000)
	runner()
	let dedline = parseDate(data.config.endDate)
	set("till-date", dedline.toLocaleString('en', { day: "numeric", month: "long", year: "numeric" }))

	// Load themes
	let selector = get("theme-select").children
	for (let theme of selector) {
		theme.onclick = (e) => {
			setTheme(theme.className)
		}
	}
	let theme = "default"
	try {
		theme = localStorage.getItem("theme")
	}
	catch (e) {
		console.warn("Please enable cookies in your browser if you want to store your theme setting.")
	}
	setTheme(theme)
}


// Countdown service
function runner() {
	let map = getMap()
	let interpreter = mapInterpreter(map)

	// Main progress bar & info
	let percent_passed = (100 * map.summary.minutesPassed / map.summary.minutesTotal).toFixed(3)
	if (percent_passed > 100) percent_passed = (100).toFixed(1)
	set("pp-main", fancy_pp(percent_passed))

	let week_progress = 0
	for (week of map.map) {
		let progress = 0
		for (lesson of week) {
			progress += lesson.passed
		}
		week_progress += progress / week.length
	}
	mainBar.set(week_progress)

	set("lessons-left", Math.floor(map.summary.lessonsTotal - map.summary.lessonsPassed))
	set("lessons-time-left", mkTime(map.summary.lessonMinutesTotal - map.summary.lessonMinutesPassed))
	set("days-left", Math.round(map.summary.daysTotal - map.summary.daysPassed))
	set("days-time-left", mkTime(map.summary.minutesTotal - map.summary.minutesPassed))

	// Current lesson
	let current_div = get("current_lesson")
	if (interpreter.now) {
		current_div.classList.remove("hidden")
		set_lesson_box(
			current_div.getElementsByClassName("lesson")[0],
			interpreter.now.name,
			`Time left: ${mkTime(interpreter.now.duration - interpreter.now.duration * interpreter.now.passed)}`,
			interpreter.now.passed * 100,
			1
		)
	}
	else current_div.classList.add("hidden")

	// Bad lessons list
	let container = document.getElementsByClassName("bad_lessons")[0]
	if (container.innerHTML == "") {
		for (lesson of data.config.badLessons) {
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
		let r = interpreter.subjects[subject]
		set_lesson_box(
			item,
			subject,
			`Lessons left: ${Math.floor(r.total - r.passed)}<br>${mkTime(r.minutesTotal - r.minutesPassed)}`,
			100 * r.minutesPassed / r.minutesTotal,
			2
		)
	}
}
