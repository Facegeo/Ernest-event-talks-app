import requests
import feedparser
import json

def check_feed():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    print(f"Fetching feed from {url}...")
    try:
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        # Parse feed
        feed = feedparser.parse(response.content)
        print(f"Feed Title: {feed.feed.get('title', 'N/A')}")
        print(f"Number of entries: {len(feed.entries)}")
        
        for idx in range(min(3, len(feed.entries))):
            entry = feed.entries[idx]
            print(f"\n================ ENTRY {idx+1} ================")
            print(f"Title: {entry.get('title')}")
            print(f"Updated: {entry.get('updated')}")
            
            content_val = ""
            if 'content' in entry:
                content_val = entry.content[0].value
            elif 'summary' in entry:
                content_val = entry.summary
                
            print("Content HTML:")
            print(content_val)
            print("============================================\n")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_feed()
