"""
AttenTrack — App Classifier
Maps process names → app names + categories.
For browsers, parses the window title to identify the specific website.
"""

# Process name → (display name, default category)
KNOWN_APPS = {
    # Browsers (category will be overridden by website classification)
    'chrome.exe':       ('Chrome', 'Work'),
    'brave.exe':        ('Brave', 'Work'),
    'firefox.exe':      ('Firefox', 'Work'),
    'msedge.exe':       ('Edge', 'Work'),
    'opera.exe':        ('Opera', 'Work'),
    'vivaldi.exe':      ('Vivaldi', 'Work'),
    # Social & Communication
    'discord.exe':      ('Discord', 'Social'),
    'telegram.exe':     ('Telegram', 'Communication'),
    'whatsapp.exe':     ('WhatsApp', 'Communication'),
    'slack.exe':        ('Slack', 'Communication'),
    'teams.exe':        ('Microsoft Teams', 'Communication'),
    'skype.exe':        ('Skype', 'Communication'),
    'zoom.exe':         ('Zoom', 'Communication'),
    # Entertainment
    'spotify.exe':      ('Spotify', 'Entertainment'),
    'vlc.exe':          ('VLC', 'Entertainment'),
    'itunes.exe':       ('iTunes', 'Entertainment'),
    # Development
    'code.exe':         ('VS Code', 'Work'),
    'devenv.exe':       ('Visual Studio', 'Work'),
    'pycharm64.exe':    ('PyCharm', 'Work'),
    'idea64.exe':       ('IntelliJ IDEA', 'Work'),
    'sublime_text.exe': ('Sublime Text', 'Work'),
    'notepad++.exe':    ('Notepad++', 'Work'),
    'windowsterminal.exe': ('Terminal', 'Work'),
    'powershell.exe':   ('PowerShell', 'Work'),
    'cmd.exe':          ('Command Prompt', 'Work'),
    'git-bash.exe':     ('Git Bash', 'Work'),
    # Office
    'winword.exe':      ('Microsoft Word', 'Work'),
    'excel.exe':        ('Microsoft Excel', 'Work'),
    'powerpnt.exe':     ('PowerPoint', 'Work'),
    'onenote.exe':      ('OneNote', 'Work'),
    'outlook.exe':      ('Outlook', 'Communication'),
    'notepad.exe':      ('Notepad', 'Work'),
    # File Management
    'explorer.exe':     ('File Explorer', 'Other'),
    # Gaming (add more as needed)
    'steam.exe':        ('Steam', 'Entertainment'),
    'epicgameslauncher.exe': ('Epic Games', 'Entertainment'),
}

# Browser process names — used to check if the foreground app is a browser
BROWSER_PROCESSES = {
    'chrome.exe', 'brave.exe', 'firefox.exe', 'msedge.exe',
    'opera.exe', 'vivaldi.exe', 'iexplore.exe'
}

# Website keywords → (site name, category)
# Matched against browser window titles
WEBSITE_RULES = [
    # Social Media
    ('instagram',   'Instagram',   'Social'),
    ('facebook',    'Facebook',    'Social'),
    ('twitter',     'Twitter/X',   'Social'),
    ('x.com',       'Twitter/X',   'Social'),
    ('linkedin',    'LinkedIn',    'Social'),
    ('reddit',      'Reddit',      'Social'),
    ('tumblr',      'Tumblr',      'Social'),
    ('snapchat',    'Snapchat',    'Social'),
    ('tiktok',      'TikTok',      'Social'),
    ('pinterest',   'Pinterest',   'Social'),
    # Entertainment
    ('youtube',     'YouTube',     'Entertainment'),
    ('netflix',     'Netflix',     'Entertainment'),
    ('twitch',      'Twitch',      'Entertainment'),
    ('primevideo',  'Prime Video', 'Entertainment'),
    ('hotstar',     'Hotstar',     'Entertainment'),
    ('disneyplus',  'Disney+',     'Entertainment'),
    ('spotify',     'Spotify Web', 'Entertainment'),
    ('soundcloud',  'SoundCloud',  'Entertainment'),
    # Communication
    ('gmail',       'Gmail',       'Communication'),
    ('outlook',     'Outlook',     'Communication'),
    ('mail.google', 'Gmail',       'Communication'),
    ('slack.com',   'Slack',       'Communication'),
    ('discord.com', 'Discord',     'Social'),
    ('whatsapp',    'WhatsApp Web','Communication'),
    ('telegram',    'Telegram Web','Communication'),
    # Work / Productivity
    ('github',      'GitHub',      'Work'),
    ('gitlab',      'GitLab',      'Work'),
    ('stackoverflow','Stack Overflow','Work'),
    ('docs.google', 'Google Docs', 'Work'),
    ('sheets.google','Google Sheets','Work'),
    ('notion',      'Notion',      'Work'),
    ('trello',      'Trello',      'Work'),
    ('jira',        'Jira',        'Work'),
    ('figma',       'Figma',       'Work'),
    # Education
    ('coursera',    'Coursera',    'Education'),
    ('udemy',       'Udemy',       'Education'),
    ('khan',        'Khan Academy','Education'),
    ('edx.org',     'edX',         'Education'),
    ('leetcode',    'LeetCode',    'Education'),
    # News
    ('news',        'News',        'News'),
    ('bbc',         'BBC',         'News'),
    ('cnn',         'CNN',         'News'),
    ('nytimes',     'NY Times',    'News'),
    # Shopping
    ('amazon',      'Amazon',      'Other'),
    ('flipkart',    'Flipkart',    'Other'),
    ('myntra',      'Myntra',      'Other'),
    # Search
    ('google.com/search','Google Search','Work'),
    ('bing.com',    'Bing',        'Work'),
]


def classify_app(process_name, window_title=''):
    """
    Returns (app_name, category, is_browser_site) from a process name and window title.
    For browsers, tries to identify the specific website from the title.
    """
    proc_lower = process_name.lower()
    title_lower = window_title.lower() if window_title else ''

    # Check if it's a browser
    if proc_lower in BROWSER_PROCESSES:
        # Try to match a specific website from the window title
        for keyword, site_name, category in WEBSITE_RULES:
            if keyword in title_lower:
                return site_name, category, True

        # Unknown website — use browser name
        browser_info = KNOWN_APPS.get(proc_lower, (process_name, 'Other'))
        # Try to extract site name from title (e.g. "GitHub - Google Chrome" → "GitHub")
        if ' - ' in window_title and window_title.strip():
            parts = window_title.rsplit(' - ', 1)
            site_name = parts[0].strip()[:50]  # Cap at 50 chars
            if site_name:
                return site_name, 'Other', True
        return browser_info[0], browser_info[1], True

    # Non-browser application
    if proc_lower in KNOWN_APPS:
        name, category = KNOWN_APPS[proc_lower]
        return name, category, False

    # Unknown application — use process name (without .exe)
    clean_name = process_name.replace('.exe', '').replace('.EXE', '')
    return clean_name, 'Other', False
