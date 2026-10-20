import os
import sys

# Ensure parent directory is on sys.path so app can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

# Export the WSGI application for Vercel
# Vercel's Python runtime discovers 'app' automatically
