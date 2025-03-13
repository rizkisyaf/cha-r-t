from app import app, socketio

if __name__ == '__main__':
    # Run the app with socketio on port 5001 as specified in start.sh
    socketio.run(app, host='0.0.0.0', port=5001, debug=True, allow_unsafe_werkzeug=True) 