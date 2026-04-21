"""
AttenTrack — Database Writer
Writes screen time entries directly to the MySQL database.
Reads the user's distracting apps list to auto-flag entries.
"""

import mysql.connector
from datetime import date, datetime


DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '34691218',
    'database': 'attentrack'
}


def get_connection():
    """Get a fresh MySQL connection."""
    return mysql.connector.connect(**DB_CONFIG)


def get_user_id(email='prayaskar024@gmail.com'):
    """Get the user ID for the given email. Defaults to the demo user."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return row['id'] if row else None


def get_distracting_apps(user_id):
    """Fetch the user's distraction list from MySQL."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT appName, url FROM distracting_apps WHERE userId = %s",
        (user_id,)
    )
    apps = cursor.fetchall()
    cursor.close()
    conn.close()
    # Build lookup sets (lowercase for matching)
    names = {a['appName'].lower() for a in apps}
    urls = {a['url'].lower() for a in apps if a.get('url')}
    return names, urls


def is_distracting(app_name, distracting_names, distracting_urls):
    """Check if an app/site is in the user's distraction list."""
    name_lower = app_name.lower()
    for d in distracting_names:
        if d in name_lower or name_lower in d:
            return True
    for u in distracting_urls:
        if u in name_lower or name_lower in u:
            return True
    return False


def write_entries(user_id, entries, distracting_names, distracting_urls):
    """
    Write a batch of screen time entries to MySQL.
    
    entries: list of dicts with keys:
        app, category, usage_seconds, is_browser_site, notifications, times_opened, hour
    """
    if not entries:
        return 0

    conn = get_connection()
    cursor = conn.cursor()
    today = date.today().isoformat()
    now = datetime.now().isoformat()
    count = 0

    for entry in entries:
        usage_minutes = round(entry['usage_seconds'] / 60, 2)
        if usage_minutes < 0.05:  # Skip entries < 3 seconds
            continue

        flagged = is_distracting(
            entry['app'], distracting_names, distracting_urls
        )

        cursor.execute("""
            INSERT INTO screen_time_entries
                (userId, app, category, date, usageMinutes, notifications,
                 timesOpened, isDistracting, hour, createdAt, updatedAt)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id,
            entry['app'],
            entry['category'],
            today,
            usage_minutes,
            entry.get('notifications', 0),
            entry.get('times_opened', 1),
            flagged,
            entry.get('hour', datetime.now().hour),
            now, now
        ))
        count += 1

    conn.commit()
    cursor.close()
    conn.close()
    return count


def get_today_summary(user_id):
    """Quick summary of today's tracked data."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    today = date.today().isoformat()
    cursor.execute("""
        SELECT 
            COUNT(*) as entries,
            COALESCE(SUM(usageMinutes), 0) as totalMinutes,
            COALESCE(SUM(CASE WHEN isDistracting = 1 THEN usageMinutes ELSE 0 END), 0) as distractingMinutes,
            COUNT(DISTINCT app) as uniqueApps
        FROM screen_time_entries
        WHERE userId = %s AND date = %s
    """, (user_id, today))
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result
