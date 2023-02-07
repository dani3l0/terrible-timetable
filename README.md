# Terrible Timetable

Can't stand waiting for the end of the school year? Here's the solution which will help you survive a difficult period.

App countdowns literally everything related to lessons & wasted time at school.

# Installation
Simply, put all files in some web server directory.

App works even without Internet access, as all requirements are self-hosted (I just uploaded them to this repo tbh).

# Config
There is a file called `config.json`. This is where your terrible timetable is taken from.

**Section** `config`:
- `startDate` - This is the date when your terrible timetable starts in format `yyyy-mm-dd`. For now, it must be Monday
- `endDate` - This is the date when your terrible timetable ends. Must be Friday.
- `badLessons` - an array, subject names you want to have listed on main page
- `freeDays` -  list of free days you don't go to school, those will be ignored in the countdown

**Section** `timetable`:
This is an object with stored arrays as timetable.

Empty timetable looks like this. Please note it **has to** start with Sunday:
```
...
"timetable": {
	"Sunday": [],
	"Monday": [],
	"Tuesday": [],
	"Wednesday": [],
	"Thursday": [],
	"Friday": [],
	"Saturday": []
}
...
```

A timetable entry should look like this (example with 2 lessons):
```
...
    "Monday": [
            {
                "name": "Matematyka",
                "starts": "8:00",
                "ends": "8:45"
            },
            {
                "name": "Język polski",
                "starts": "8:00",
                "ends": "8:45"
            }
    ]
...
```
Where `name` is subject name,

`starts` & `ends` is time in format `HH:SS`


