from flask import Flask, render_template, jsonify, request
import requests
import feedparser
from bs4 import BeautifulSoup
import hashlib
import re
import urllib.parse

app = Flask(__name__)

# Simple in-memory cache
cached_releases = None
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def generate_item_id(date_str, type_str, text_str):
    """Generates a stable, unique ID for a specific release note item."""
    hash_input = f"{date_str}-{type_str}-{text_str[:100]}"
    return hashlib.md5(hash_input.encode('utf-8')).hexdigest()

def clean_html_content(soup_element):
    """Cleans up internal Google Cloud relative URLs and formats links to open in a new tab."""
    for a in soup_element.find_all('a'):
        href = a.get('href', '')
        # Convert relative links to absolute GCP documentation links
        if href.startswith('/'):
            a['href'] = f"https://cloud.google.com{href}"
        a['target'] = '_blank'
        a['rel'] = 'noopener noreferrer'
    return str(soup_element)

def fetch_and_parse_releases():
    """Fetches the RSS feed and parses it into structured update items."""
    try:
        response = requests.get(FEED_URL, timeout=10)
        if response.status_code != 200:
            return None, f"Failed to fetch feed: HTTP {response.status_code}"
        
        feed = feedparser.parse(response.content)
        parsed_items = []
        
        for entry in feed.entries:
            date_str = entry.get('title', 'Unknown Date')
            
            # Extract HTML content
            content_html = ""
            if 'content' in entry:
                content_html = entry.content[0].value
            elif 'summary' in entry:
                content_html = entry.summary
                
            if not content_html:
                continue
                
            # Parse the content HTML to split by type headers (e.g., h3)
            soup = BeautifulSoup(content_html, 'html.parser')
            
            current_type = "Update"
            current_elements = []
            
            # Iterate through children elements
            for child in soup.contents:
                # If it's a NavigableString (text node outside element), ignore if empty
                if child.name is None:
                    continue
                    
                if child.name == 'h3':
                    # Save previous item group if we have elements accumulated
                    if current_elements:
                        item_soup = BeautifulSoup("", 'html.parser')
                        for el in current_elements:
                            item_soup.append(el)
                        
                        html_cleaned = clean_html_content(item_soup)
                        text_content = item_soup.get_text().strip()
                        # Clean up multiple whitespaces
                        text_content = re.sub(r'\s+', ' ', text_content)
                        
                        item_id = generate_item_id(date_str, current_type, text_content)
                        parsed_items.append({
                            'id': item_id,
                            'date': date_str,
                            'type': current_type,
                            'html': html_cleaned,
                            'text': text_content
                        })
                        current_elements = []
                    
                    current_type = child.get_text().strip()
                else:
                    # Append sibling element to the current type group
                    # BS4 elements are modified in-place, so we clone/append them later
                    current_elements.append(child)
            
            # Save the last item group for the entry
            if current_elements:
                item_soup = BeautifulSoup("", 'html.parser')
                for el in current_elements:
                    item_soup.append(el)
                
                html_cleaned = clean_html_content(item_soup)
                text_content = item_soup.get_text().strip()
                text_content = re.sub(r'\s+', ' ', text_content)
                
                item_id = generate_item_id(date_str, current_type, text_content)
                parsed_items.append({
                    'id': item_id,
                    'date': date_str,
                    'type': current_type,
                    'html': html_cleaned,
                    'text': text_content
                })
                
        return parsed_items, None
    except Exception as e:
        return None, str(e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    global cached_releases
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    
    if cached_releases is None or force_refresh:
        items, error = fetch_and_parse_releases()
        if error:
            return jsonify({'success': False, 'error': error}), 500
        cached_releases = items
        
    return jsonify({'success': True, 'data': cached_releases})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
