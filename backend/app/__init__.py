from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')

# Enable CORS
CORS(app)

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# Import routes after app initialization to avoid circular imports
from app import routes 