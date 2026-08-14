# Experiment: Interactive Calendar for Post Scheduling

## Aim
To design and implement an interactive calendar interface for scheduling and managing posts.

## Objective
- To understand time-based data visualization in UI systems
- To implement calendar-based scheduling interfaces
- To map structured data to temporal layouts
- To enable user interactions such as drag-and-drop

## COs Mapped
CO3 - BT3

## Pre-requisites
- Knowledge of React.js
- Understanding of state management (preferably Redux)
- Basic understanding of date/time handling in JavaScript

## Software Requirements
- React.js
- Calendar library (built as a custom component here, no external calendar dependency)
- Date utility libraries (native `Date` object is used — no extra dependency required)
- Code editor
- A modern browser (Chrome, Edge, Firefox) with an internet connection, to load React/fonts from CDN

## Description / Theory
Calendars are essential UI components for representing time-based data. In applications
such as social media schedulers, events (posts) must be mapped to specific dates and time
slots.

A calendar system involves:
- **Temporal data modeling** — each post carries a `date`, `time`, and `platform`
- **Event mapping** — linking posts to specific day cells in a rendered month grid
- **User interaction handling** — click, drag, and drop to schedule or reschedule

Interactive calendars enhance usability by allowing users to visually organize content,
modify schedules dynamically, and manage large datasets efficiently.

## What this implementation covers
- A **month-grid calendar**, generated from plain JavaScript `Date` math (no external
  calendar library), with previous/next navigation and a "Today" shortcut
- A **post queue** sidebar holding unscheduled posts
- **Drag-and-drop** using the native HTML5 Drag and Drop API:
  - drag a queued post onto any day to schedule it
  - drag a scheduled post onto a different day to reschedule it
  - drag a scheduled post back onto the queue to unschedule it
- **Click-to-edit**: clicking any post card (queued or scheduled) opens a modal to edit
  its title, platform, date, and time, or delete it
- **Add via day cell**: hovering a day reveals a `+` button that opens the modal
  pre-filled with that date
- State is held in a single React `useState` array (`posts`), demonstrating the same
  shape of state you would lift into a Redux slice — `posts: Post[]` with actions like
  `scheduled`, `rescheduled`, `unscheduled`, `added`, `updated`, `removed`

## Project structure
```
post-scheduler-calendar/
├── index.html     # page shell, loads fonts + React (CDN) + app.jsx
├── styles.css      # design tokens and layout/theme
├── app.jsx         # calendar logic, drag-and-drop, modal, all components
└── README.md
```

## How to run
No build step or npm install is required — React and Babel are loaded from a CDN and
JSX is compiled in the browser.

1. Unzip the folder.
2. Open `index.html` directly in a browser, **or** serve it locally (recommended, some
   browsers restrict local script loading over `file://`):
   ```bash
   cd post-scheduler-calendar
   python3 -m http.server 8080
   ```
   Then visit `http://localhost:8080`.

## Extending toward Redux Toolkit
This experiment intentionally keeps state in local `useState` so the logic is easy to
read end-to-end in one file. To move it into Redux Toolkit (per the pre-requisites):
- Create a `postsSlice` with the `posts` array as initial state
- Convert `setPosts(...)` calls into reducers: `postScheduled`, `postRescheduled`,
  `postUnscheduled`, `postAdded`, `postUpdated`, `postRemoved`
- Replace `useState`/`useMemo` reads with `useSelector`, and mutations with
  `useDispatch(...)`
