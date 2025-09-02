import os
from flask import Flask, render_template, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from collections import defaultdict

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev")
CORS(app, origins=["*"])

socketio = SocketIO(
    app, 
    cors_allowed_origins="*",
    async_mode='threading',
    ping_timeout=60,
    ping_interval=25
)

users_by_sid = {}
room_members = defaultdict(list)

@app.route('/health')
def health_check():
    return {'status': 'healthy'}, 200

def get_unique_nick(nick, room):
    base, i = nick, 1
    while any(user["nick"] == nick for user in room_members[room]):
        i += 1
        nick = f"{base}-{i}"
    return nick

def update_presence(room):
    print("Updating presence for room:", room)
    print("Current members:", room_members[room])
    presence_data = {"count": len(room_members[room]), "members": sorted(room_members[room], key=lambda x: x["nick"])}
    emit("presence", presence_data, room=room)
    users = [{"nick": user["nick"], "pfp": user.get("pfp")} for user in room_members[room]]
    emit("updateUserList", users, broadcast=True)

@app.route("/")
def index():
    return render_template("index.html")

@socketio.on("join")
def join(data):
    nick = str(data.get("nick") or "Guest").strip()
    room = str(data.get("room") or "general").strip()
    pfp = str(data.get("pfp") or "https://raw.githubusercontent.com/iFreaku/keepbooks/refs/heads/main/static/avatar/1.png").strip()
    
    prev = users_by_sid.get(request.sid)
    if prev:
        prev_room = prev["room"]
        leave_room(prev_room)
        room_members[prev_room] = [user for user in room_members[prev_room] if user["nick"] != prev["nick"]]
        emit("left", {"nick": prev["nick"]}, room=prev_room, include_self=False, broadcast=True)
        update_presence(prev_room)
    
    nick = get_unique_nick(nick, room)
    join_room(room)
    users_by_sid[request.sid] = {"nick": nick, "room": room}
    room_members[room].append({"nick": nick, "pfp": pfp})
    emit("joined", {"nick": nick, "room": room, "pfp": pfp}, broadcast=True)
    update_presence(room)

@socketio.on("switch")
def switch(data):
    nick = users_by_sid.get(request.sid, {}).get("nick")
    if not nick:
        return
    new_room = (data.get("room") or "general").strip()
    cur_room = users_by_sid[request.sid]["room"]
    if new_room == cur_room:
        return
    
    leave_room(cur_room)
    room_members[cur_room] = [user for user in room_members[cur_room] if user["nick"] != nick]
    emit("left", {"nick": nick}, room=cur_room, include_self=False, broadcast=True)
    update_presence(cur_room)
    
    join_room(new_room)
    users_by_sid[request.sid]["room"] = new_room
    user_pfp = next((u["pfp"] for u in room_members[cur_room] if u["nick"] == nick), "https://raw.githubusercontent.com/iFreaku/keepbooks/refs/heads/main/static/avatar/1.png")
    room_members[new_room].append({"nick": nick, "pfp": user_pfp})
    emit("joined", {"nick": nick, "room": new_room}, broadcast=True)
    update_presence(new_room)

@socketio.on("msg")
def msg(data):
    user = users_by_sid.get(request.sid)
    if not user: 
        return
    t = (data.get("txt") or "").strip()
    if not t: 
        return
    emit("msg", {"nick": data.get("nick"), "pfp": data.get("pfp"), "msg": t, "room": data.get("room")}, broadcast=True)

@socketio.on("typing")
def typing():
    user = users_by_sid.get(request.sid)
    if user:
        emit("typing", {"nick": user["nick"]}, room=user["room"], include_self=False)

@socketio.on("styping")
def styping():
    user = users_by_sid.get(request.sid)
    if user:
        emit("styping", {"nick": user["nick"]}, room=user["room"], include_self=False)

@socketio.on("disconnect")
def disc():
    user = users_by_sid.pop(request.sid, None)
    if user:
        room_members[user["room"]] = [u for u in room_members[user["room"]] if u["nick"] != user["nick"]]
        emit("left", {"nick": user["nick"]}, room=user["room"], include_self=False, broadcast=True)
        update_presence(user["room"])

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    
    print(f"🚀 Starting server on port {port}")
    socketio.run(
        app, 
        host="0.0.0.0", 
        port=port, 
        debug=debug,
        use_reloader=False,
        allow_unsafe_werkzeug=True 
    )
