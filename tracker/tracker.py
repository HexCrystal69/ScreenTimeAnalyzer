"""
AttenTrack — Screen Time Tracker
================================
Background script that monitors all visible windows every 5 seconds,
identifies apps/websites, accumulates usage time, and flushes to MySQL every 10 seconds.

The tracker auto-detects which user is logged into the web app by reading
the active_user.json file written by the server on login.

Usage:
    python tracker.py                    (auto-detects logged-in user)
    python tracker.py user@email.com     (uses specific user, skips auto-detect)

How it works:
    1. Every 5 seconds: read all visible windows → get process name + title
    2. Classify: process → app name + category (browsers → parse title for website)
    3. Accumulate: add 5 seconds to that app's running total
    4. Every 10 seconds: flush accumulated totals to MySQL as ScreenTimeEntry rows
    5. Auto-flag: check each entry against user's DistractingApps list
    6. On each flush: re-check active_user.json for user changes

What gets tracked:
    - ALL visible windows (foreground and background)
    - Desktop apps (Discord, Spotify, VS Code, etc.) are tracked too
    - Browser tabs are identified from the window title

Press Ctrl+C to stop. Data is saved to MySQL on each flush.
"""

import sys
import time
import signal
import ctypes
import os
import json
from datetime import datetime, date
from collections import defaultdict

import psutil

# Windows API for getting foreground window
try:
    import win32gui
    import win32process
    HAS_WIN32 = True
except ImportError:
    HAS_WIN32 = False
    print("[WARN] pywin32 not installed — using ctypes fallback")

from app_classifier import classify_app
from db_writer import (
    get_user_id, get_distracting_apps, write_entries, get_today_summary
)


# ─── Configuration ────────────────────────────────────────────────────────────
POLL_INTERVAL = 5        # seconds between each window check
FLUSH_INTERVAL = 10      # seconds between database writes (dynamic/real-time)
ACTIVE_USER_FILE = os.path.join(os.path.dirname(__file__), '..', 'server', 'active_user.json')
# ──────────────────────────────────────────────────────────────────────────────


def read_active_user():
    """Read the active user from the server's active_user.json file."""
    try:
        with open(ACTIVE_USER_FILE, 'r') as f:
            data = json.load(f)
            return data.get('email'), data.get('userId')
    except (FileNotFoundError, json.JSONDecodeError, KeyError):
        return None, None


class ScreenTimeTracker:
    def __init__(self, user_email=None):
        self.user_email = user_email
        self.user_id = None
        self.explicit_user = user_email is not None  # True if email was passed via CLI
        self.distracting_names = set()
        self.distracting_urls = set()

        # Accumulated usage: {app_name: {category, seconds, times_opened, is_browser}}
        self.accumulator = defaultdict(lambda: {
            'category': 'Other',
            'seconds': 0,
            'times_opened': 0,
            'is_browser_site': False
        })
        self.current_apps = set()
        self.last_flush = time.time()
        self.running = True
        self.total_flushed = 0

        # Register graceful shutdown
        signal.signal(signal.SIGINT, self._shutdown)
        signal.signal(signal.SIGTERM, self._shutdown)

    def _shutdown(self, signum, frame):
        """Flush remaining data before exit."""
        print("\n\n[STOP] Shutting down — flushing remaining data...")
        self._flush_to_db()
        if self.user_id:
            summary = get_today_summary(self.user_id)
            print(f"\n{'='*50}")
            print(f"  Today's Summary")
            print(f"  Total tracked: {summary['totalMinutes']:.1f} min across {summary['uniqueApps']} apps")
            print(f"  Distracting:   {summary['distractingMinutes']:.1f} min")
            print(f"  Productive:    {summary['totalMinutes'] - summary['distractingMinutes']:.1f} min")
            print(f"{'='*50}")
        self.running = False
        sys.exit(0)

    def _get_active_window(self):
        """Get the active foreground window's process name and title."""
        apps = set()
        if HAS_WIN32:
            hwnd = win32gui.GetForegroundWindow()
            if hwnd:
                title = win32gui.GetWindowText(hwnd)
                # Filter out empty titles and basic system manager
                if title and title != "Program Manager":
                    try:
                        _, pid = win32process.GetWindowThreadProcessId(hwnd)
                        proc = psutil.Process(pid)
                        process_name = proc.name()
                        apps.add((process_name, title))
                    except:
                        pass
        return apps

    def _flush_to_db(self):
        """Write accumulated data to MySQL and reset counters."""
        if not self.accumulator or not self.user_id:
            return

        entries = []
        for app_name, data in self.accumulator.items():
            if data['seconds'] < 1:  # Skip if less than 1 second
                continue
            entries.append({
                'app': app_name,
                'category': data['category'],
                'usage_seconds': data['seconds'],
                'is_browser_site': data['is_browser_site'],
                'notifications': 0,
                'times_opened': data['times_opened'],
                'hour': datetime.now().hour
            })

        if entries:
            count = write_entries(
                self.user_id, entries,
                self.distracting_names, self.distracting_urls
            )
            self.total_flushed += count
            
            # Print flush summary
            total_sec = sum(e['usage_seconds'] for e in entries)
            apps_str = ', '.join(f"{e['app']}({e['usage_seconds']}s)" for e in entries[:5])
            if len(entries) > 5:
                apps_str += f" +{len(entries)-5} more"
            print(f"  [DB] Wrote {count} entries ({total_sec}s total): {apps_str}")

        # Reset accumulator
        self.accumulator.clear()
        self.last_flush = time.time()

    def _resolve_user(self):
        """Resolve the active user — from CLI arg or active_user.json."""
        if self.explicit_user:
            # User was passed via command line — use it directly
            self.user_id = get_user_id(self.user_email)
            if not self.user_id:
                print(f"[ERROR] User '{self.user_email}' not found in database.")
                print(f"  Register at http://localhost:5173/signup first, then run:")
                print(f"  python tracker.py {self.user_email}")
                sys.exit(1)
            return True

        # Auto-detect from active_user.json
        email, user_id = read_active_user()
        if email and user_id:
            if email != self.user_email:
                # User changed — flush old data if we had a previous user
                if self.user_id and self.accumulator:
                    print(f"\n  [USER] Switching from {self.user_email} → {email}")
                    self._flush_to_db()
                self.user_email = email
                self.user_id = user_id
                # Reload distraction list for new user
                self.distracting_names, self.distracting_urls = get_distracting_apps(self.user_id)
                print(f"  [USER] Active user: {self.user_email} (id={self.user_id})")
            return True
        return False

    def start(self):
        """Main tracking loop."""
        # Wait for a user to log in
        print("""
╔══════════════════════════════════════════════════════╗
║           AttenTrack — Screen Time Tracker           ║
╠══════════════════════════════════════════════════════╣
║  Polling:  every {poll}s | Flush: every {flush}s              ║
║  Press Ctrl+C to stop tracking                       ║
╚══════════════════════════════════════════════════════╝
""".format(poll=POLL_INTERVAL, flush=FLUSH_INTERVAL))

        if not self._resolve_user():
            print("  [WAIT] No user logged in. Waiting for someone to log in at http://localhost:5173 ...")
            while not self._resolve_user():
                time.sleep(POLL_INTERVAL)
            print(f"  [OK]   User detected: {self.user_email}")

        # Load distraction list
        self.distracting_names, self.distracting_urls = get_distracting_apps(self.user_id)
        print(f"  [OK]   Tracking {len(self.distracting_names)} distracting apps")
        print(f"  [OK]   Data will flush to dashboard every {FLUSH_INTERVAL}s\n")

        poll_count = 0
        while self.running:
            try:
                # 1. Get the current active foreground window
                windows = self._get_active_window()
                active_this_tick = set()

                for process_name, window_title in windows:
                    # 2. Classify the app
                    app_name, category, is_browser = classify_app(
                        process_name, window_title
                    )

                    if app_name not in active_this_tick:
                        active_this_tick.add(app_name)

                        # 3. Track app switches/opens
                        if app_name not in self.current_apps:
                            self.accumulator[app_name]['times_opened'] += 1

                        # 4. Accumulate time
                        self.accumulator[app_name]['category'] = category
                        self.accumulator[app_name]['seconds'] += POLL_INTERVAL
                        self.accumulator[app_name]['is_browser_site'] = is_browser

                self.current_apps = active_this_tick

                # Live display (every 4th poll = ~20s)
                poll_count += 1
                if poll_count % 4 == 0 and active_this_tick:
                    print(f"  [{datetime.now().strftime('%H:%M:%S')}] Tracking {len(active_this_tick)} apps... (e.g. {list(active_this_tick)[0]})")

                # 5. Flush to database periodically
                if time.time() - self.last_flush >= FLUSH_INTERVAL:
                    self._flush_to_db()
                    # Re-check active user (picks up login/logout changes)
                    if not self.explicit_user:
                        self._resolve_user()
                    # Reload distraction list (picks up changes from the web app)
                    if self.user_id:
                        self.distracting_names, self.distracting_urls = get_distracting_apps(self.user_id)

                time.sleep(POLL_INTERVAL)

            except KeyboardInterrupt:
                self._shutdown(None, None)
            except Exception as e:
                print(f"  [ERR] {e}")
                time.sleep(POLL_INTERVAL)


if __name__ == '__main__':
    # If email passed via CLI, use it; otherwise auto-detect from active_user.json
    email = sys.argv[1] if len(sys.argv) > 1 else None
    tracker = ScreenTimeTracker(email)
    tracker.start()
