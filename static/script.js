// ..####....####....####...##..##..######..######.
// .##......##..##..##..##..##.##...##........##...
// ..####...##..##..##......####....####......##...
// .....##..##..##..##..##..##.##...##........##...
// ..####....####....####...##..##..######....##...
// ................................................
// -------------------------------------------------
let socket = null;
let isConnected = false;
let typingTimeout = null;


function getSocketIOServerUrl() {
    return `${window.location.protocol}//${window.location.hostname}`;
}

function connectToSocketIO(nick, pfp, room = 'general') {
    if (socket && socket.connected) {
        socket.disconnect();
    }
    
    const serverUrl = getSocketIOServerUrl();
    console.log('Connecting to:', serverUrl);
    
    socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,         
        reconnection: true,       
        reconnectionDelay: 1000,  
        reconnectionAttempts: 5,
        maxReconnectionAttempts: 5
    });

    socket.on('connect', () => {
        isConnected = true;
        console.log('Connected!');
        socket.emit('join', { nick, pfp, room });
    });

    socket.on('disconnect', (reason) => {
        isConnected = false;
        console.log('❌ Disconnected:', reason);
        
        // if (reason === 'io server disconnect') {
        //     socket.connect();
        // }
    });

    socket.on('joined', (data) => {
        console.log('Joined!', data);
        displayMsg('System', 'https://www.shutterstock.com/image-vector/chat-bot-icon-virtual-smart-600nw-2478937555.jpg', `→ ${data.nick} joined the room.`);
    });

    socket.on('joined-2', (data) => {
        storeData("nick", data.nick);
    });

    socket.on('left', (data) => {
        console.log('Left!', data.nick);
        displayMsg('System', 'https://www.shutterstock.com/image-vector/chat-bot-icon-virtual-smart-600nw-2478937555.jpg', `← ${data.nick} left the room.`);
    });

    socket.on('updateUserList', (users) => {
        updateUserList(users);
    });

    socket.on('typing', (data) => {
        showTypingIndicator(`${data.nick} is typing...`);
    });

    socket.on('styping', (data) => {
        hideTypingIndicator();
    });

    socket.on('msg', (data) => {
        displayMsg(data.nick, data.pfp, data.msg);
        hideTypingIndicator();
        const chatList = document.getElementById('chatlist');
        chatList.scrollTop = chatList.scrollHeight;
    });

    socket.on('media', (data) => {
        displayMedia(data.nick, data.pfp, data.msg, data.file);
        hideTypingIndicator();
        const chatList = document.getElementById('chatlist');
        chatList.scrollTop = chatList.scrollHeight;
    });

}

function disconnectSocketIO() {
    if (socket && isConnected) {
        socket.disconnect();
        socket = null;
        isConnected = false;
        console.log('Socket disconnected!');
    }
}

function updateUserList(users) {
  const userList = document.getElementById('users-list');
  userList.innerHTML = '';

  users.forEach((user) => {
    if (user.nick === getData("nick")) {
        document.getElementById('current-username').textContent = user.nick;
        document.getElementById('current-pfp').src = user.pfp;
        return;
    }

    const userElement = document.createElement('div');
    userElement.className = 'user';

    const pfpImg = document.createElement('img');
    pfpImg.className = 'pfp';
    pfpImg.src = user.pfp;
    pfpImg.alt = user.nick;
    userElement.appendChild(pfpImg);

    const usernameElement = document.createElement('span');
    usernameElement.className = 'username';
    usernameElement.textContent = user.nick;
    
    userElement.appendChild(usernameElement);
    
    userList.appendChild(userElement);
    console.log(user);
  });

  document.getElementById('user-count').textContent = users.length;
}






// .##.......####....####....####...##.....                
// .##......##..##..##..##..##..##..##.....                
// .##......##..##..##......######..##.....                
// .##......##..##..##..##..##..##..##.....                
// .######...####....####...##..##..######.                
// ........................................                
// ..####...######...####...#####....####....####...######.
// .##........##....##..##..##..##..##..##..##......##.....
// ..####.....##....##..##..#####...######..##.###..####...
// .....##....##....##..##..##..##..##..##..##..##..##.....
// ..####.....##.....####...##..##..##..##...####...######.
// ........................................................
// ------------------------------------------------
function storeData(key, value) {
    try {
        const dataToStore = typeof value === 'object' 
            ? JSON.stringify(value) 
            : value;
        
        localStorage.setItem(key, dataToStore);
        console.log(`✅ Data stored with key: ${key}`);
        return true;
    } catch (error) {
        console.error('❌ Error storing data:', error);
        return false;
    }
}

function getData(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        
        if (data === null) {
            return defaultValue;
        }
        
        try {
            return JSON.parse(data);
        } catch {
            return data;
        }
    } catch (error) {
        console.error('❌ Error getting data:', error);
        return defaultValue;
    }
}

function removeData(key) {
    try {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed data with key: ${key}`);
        return true;
    } catch (error) {
        console.error('❌ Error removing data:', error);
        return false;
    }
}

function clearAllData() {
    try {
        localStorage.clear();
        console.log('🧹 All localStorage data cleared');
        return true;
    } catch (error) {
        console.error('❌ Error clearing data:', error);
        return false;
    }
}
// --------------------------------------------------------------









// .#####....####....####...##...##...####..
// .##..##..##..##..##..##..###.###..##.....
// .#####...##..##..##..##..##.#.##...####..
// .##..##..##..##..##..##..##...##......##.
// .##..##...####....####...##...##...####..
// .........................................
// --------------------------------------------------------------
function saveRoom(roomName) {
    let rooms = getData("rooms", []);
    if (!rooms.includes(roomName)) {
        rooms.push(roomName);
        storeData("rooms", rooms);
    }
}

function getRoom() {
    return getData("rooms", []);
}
// -------------------------------------------------------------






// .##..##...####...##..##..######...####....####...######..######...####...##..##.
// .###.##..##..##..##..##....##....##......##..##....##......##....##..##..###.##.
// .##.###..######..##..##....##....##.###..######....##......##....##..##..##.###.
// .##..##..##..##...####.....##....##..##..##..##....##......##....##..##..##..##.
// .##..##..##..##....##....######...####...##..##....##....######...####...##..##.
// ................................................................................
// --------------------------------------------------------------
function toggleChannels() {
    const sidebar = document.getElementById("channels");
    const btn = document.getElementById("channels-btn");
    
    sidebar.classList.toggle("show");
}

function toggleUsers() {
    const sidebar = document.getElementById("users");
    const btn = document.getElementById("users-btn");

    sidebar.classList.toggle("show");
}

function toggleSetupModal() {
    document.getElementById("blur").classList.toggle("show")
    document.getElementById("setup-modal").classList.toggle("show");

    document.getElementById("setup-username").textContent = getData("nick");
    if(getData("pfp") !== null){
        document.getElementById("setup-pfp").src = getData("pfp");
        document.getElementById("pfp-box").value = getData("pfp");
    }
    else{
        document.getElementById("setup-pfp").src = "https://raw.githubusercontent.com/iFreaku/keepbooks/refs/heads/main/static/avatar/1.png";
        document.getElementById("pfp-box").value = "";
    }

    if(getData("nick") !== null){
        document.getElementById("nick-box").value = getData("nick");
    }
    else{
        document.getElementById("nick-box").value = "";
    }
}

function toggleAttachMediaModal() {
    document.getElementById("blur").classList.toggle("show")
    document.getElementById("attach-media-modal").classList.toggle("show");
}

// --------------------------------------------------------------











function joinGlasschat() {
    const nick = getData("nick");
    console.log(nick);
    if (nick !== null) {
        const pfp = getData("pfp") || "https://raw.githubusercontent.com/iFreaku/keepbooks/refs/heads/main/static/avatar/1.png";
        const activeRoom = getData("active_room") || "general";
        connectToSocketIO(nick, pfp, activeRoom);
    } else {
        toggleSetupModal();
    }
}


function setupForm() {
    const nickbox = document.getElementById("nick-box");
    const pfpbox = document.getElementById("pfp-box");
    const nick = String(nickbox.value).trim();
    const pfp = String(pfpbox.value).trim() || "https://raw.githubusercontent.com/iFreaku/keepbooks/refs/heads/main/static/avatar/1.png";

    if (nick) {
        disconnectSocketIO();

        storeData("nick", nick);
        storeData("pfp", pfp);

        saveRoom("general");
        storeData("active_room", "general");

        connectToSocketIO(nick, pfp, "general");

        toggleSetupModal();
    }
}













// .##......######...####...######..######..##..##..######..#####....####..
// .##........##....##........##....##......###.##..##......##..##..##.....
// .##........##.....####.....##....####....##.###..####....#####....####..
// .##........##........##....##....##......##..##..##......##..##......##.
// .######..######...####.....##....######..##..##..######..##..##...####..
// ........................................................................
// -----------------------------------

document.addEventListener('DOMContentLoaded', () => {
    console.log("Document Loaded!");
    joinGlasschat();
});

document.getElementById('nick-box').addEventListener('input', function(event) {
    document.getElementById("setup-username").textContent = event.target.value.trim();
});

document.getElementById('pfp-box').addEventListener('input', function(event) {
    document.getElementById("setup-pfp").src = event.target.value.trim();
});


document.getElementById('input-box').addEventListener('input', () => {
    if (socket && isConnected) {
        socket.emit('typing');
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('styping');
        }, 1000);
    }
});

document.getElementById('input-box').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        const message = event.target.value.trim();
        
        if (message && socket && isConnected) {
            socket.emit('msg', { 
                txt: message, 
                room: getData("active_room", "general"), 
                nick: getData("nick"), 
                pfp: getData("pfp") 
            });
            event.target.value = '';
        } else if (!isConnected) {
            console.warn('⚠️ Not connected, trying to reconnect...');
            const nick = getData("nick");
            const pfp = getData("pfp");
            if (nick) {
                connectToSocketIO(nick, pfp, getData("active_room", "general"));
            }
        }
    }
});

document.getElementById('attach-media-input').addEventListener('input', (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
        const file = files[0];
        const fileType = file.type.split('/')[0];
        const reader = new FileReader();
        if (fileType === 'image') {
            reader.onload = (event) => {
                const imageUrl = event.target.result;
                const imageElement = document.createElement('img');
                imageElement.className = 'file-preview';
                imageElement.src = imageUrl;
                imageElement.alt = file.name;
                document.getElementById("media-preview").innerHTML = '';
                document.getElementById("media-preview").appendChild(imageElement);
            };
            reader.readAsDataURL(file);
        } else if (fileType === 'video') {
            reader.onload = (event) => {
                const videoUrl = event.target.result;
                const videoElement = document.createElement('video');
                videoElement.className = 'file-preview';
                videoElement.src = videoUrl;
                videoElement.controls = true;
                videoElement.alt = file.name;
                document.getElementById("media-preview").innerHTML = '';
                document.getElementById("media-preview").appendChild(videoElement);
            };
            reader.readAsDataURL(file);
        } else if (fileType === 'audio') {
            reader.onload = (event) => {
                const audioUrl = event.target.result;
                const audioElement = document.createElement('audio');
                audioElement.className = 'file-preview';
                audioElement.src = audioUrl;
                audioElement.controls = true;
                audioElement.alt = file.name;
                document.getElementById("media-preview").innerHTML = '';
                document.getElementById("media-preview").appendChild(audioElement);
            };
            reader.readAsDataURL(file);
        } else {
            document.getElementById("media-preview").innerHTML = file.name;
        }
    }
});


function sendMsg() {
    const inputBox = document.getElementById('input-box');
    const message = inputBox.value.trim();
    if (message && socket && isConnected) {
        socket.emit('msg', { 
            txt: message, 
            room: getData("active_room", "general"), 
            nick: getData("nick"), 
            pfp: getData("pfp") 
        });
        inputBox.value = '';
    } else if (!isConnected) {
        console.warn('⚠️ Not connected, trying to reconnect...');
        const nick = getData("nick");
        const pfp = getData("pfp");
        if (nick) {
            connectToSocketIO(nick, pfp, getData("active_room", "general"));
        }
    }
}

function sendMedia() {
    const inputBox = document.getElementById('attach-media-box');
    const fileInput = document.getElementById('attach-media-input');
    const message = inputBox.value.trim();
    const files = fileInput.files;
    if (message || files.length > 0) {
        const file = files[0];
        const fileType = file.type.split('/')[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Data = event.target.result;
            const data = {
                txt: message, 
                room: getData("active_room", "general"), 
                nick: getData("nick"), 
                pfp: getData("pfp"),
                file: {
                    data: base64Data,
                    name: file.name,
                    size: formatFileSize(file.size),
                    type: fileType === 'image' || fileType === 'video' || fileType === 'audio' ? fileType : 'other'
                }
            };
            console.log(data);
            socket.emit('media', data);
        };
        
        reader.readAsDataURL(file);
        inputBox.value = '';
        fileInput.value = '';
        toggleAttachMediaModal();
    } else if (!isConnected) {
        console.warn('⚠️ Not connected, trying to reconnect...');
        const nick = getData("nick");
        const pfp = getData("pfp");
        if (nick) {
            connectToSocketIO(nick, pfp, getData("active_room", "general"));
        }
    }
}

function formatFileSize(size) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let index = 0;
    while (size >= 1024 && index < units.length - 1) {
        size /= 1024;
        index++;
    }
    return `${size.toFixed(2)} ${units[index]}`;
}

// ----------------------------------------


function showTypingIndicator(text) {
    const el = document.getElementById('typing-indicator');
    el.textContent = text;
    el.style.display = 'block';
}

function hideTypingIndicator() {
    const el = document.getElementById('typing-indicator');
    el.style.display = 'none';
}













function displayMsg(nick, pfp, msg) {
    // Create the main container
    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-container';
    
    // Create the profile picture
    const pfpImg = document.createElement('img');
    pfpImg.className = 'pfp';
    pfpImg.id = 'pfp';
    pfpImg.src = pfp;
    pfpImg.alt = nick; // Good practice for accessibility! 😊
    
    // Create the chat content container
    const chatContent = document.createElement('div');
    chatContent.className = 'chat-content';
    
    // Create the username heading
    const username = document.createElement('h3');
    username.id = 'username';
    username.textContent = nick;
    
    // Create the message paragraph
    const msgContent = document.createElement('p');
    msgContent.id = 'msg-content';
    msgContent.textContent = msg;
    
    // Assemble the structure 🔧
    chatContent.appendChild(username);
    chatContent.appendChild(msgContent);
    
    chatContainer.appendChild(pfpImg);
    chatContainer.appendChild(chatContent);
    
    // Add to chatlist
    const chatList = document.getElementById('chatlist');
    chatList.appendChild(chatContainer);
}

function displayMedia(nick, pfp, msg, file) {
  // Create the main container
  const chatContainer = document.createElement('div');
  chatContainer.className = 'chat-container';

  // Create the profile picture
  const pfpImg = document.createElement('img');
  pfpImg.className = 'pfp';
  pfpImg.id = 'pfp';
  pfpImg.src = pfp;
  pfpImg.alt = nick;

  // Create the chat content container
  const chatContent = document.createElement('div');
  chatContent.className = 'chat-content';

  // Create the username heading
  const username = document.createElement('h3');
  username.id = 'username';
  username.textContent = nick;

  // Create the message paragraph
  const msgContent = document.createElement('p');
  msgContent.id = 'msg-content';
  msgContent.textContent = msg;

  // Create the media container
  const mediaContainer = document.createElement('div');
  mediaContainer.className = 'media-container';
  mediaContainer.id = 'media-container';

  // Determine the file type and create the corresponding media element
  let mediaElement;
  if (file.type.startsWith('image')) {
    mediaElement = document.createElement('img');
    mediaElement.className = 'file-preview';
    mediaElement.id = 'file-preview';
    mediaElement.src = file.data;
    mediaElement.alt = file.name;
  } else if (file.type.startsWith('video')) {
    mediaElement = document.createElement('video');
    mediaElement.className = 'file-preview';
    mediaElement.id = 'file-preview';
    mediaElement.src = file.data;
    mediaElement.alt = file.name;
    mediaElement.controls = true;
  } else if (file.type.startsWith('audio')) {
    mediaElement = document.createElement('audio');
    mediaElement.className = 'file-preview';
    mediaElement.id = 'file-preview';
    mediaElement.src = file.data;
    mediaElement.alt = file.name;
    mediaElement.controls = true;
  } else {
    mediaElement = document.createElement('img');
    mediaElement.className = 'file-preview';
    mediaElement.id = 'file-preview';
    const fileExt = file.name.split('.').pop();
    mediaElement.src = `https://placehold.co/300x300/png?text=${fileExt}&background=cccccc&color=fff&.ext=${fileExt}`;
  }

  // Create the file header
  const fileHeader = document.createElement('div');
  fileHeader.className = 'file-header';
  fileHeader.id = 'file-header';

  // Create the file name
  const fileName = document.createElement('div');
  fileName.className = 'file-name';
  fileName.id = 'file-name';
  fileName.textContent = file.name;

  // Create the file download button
  const fileDownload = document.createElement('div');
  fileDownload.className = 'file-download';
  fileDownload.id = 'file-download';
  fileDownload.title = 'Download';
  fileDownload.innerHTML = '<i class="fa-solid fa-download"></i>';

  fileDownload.onclick = () => {
    const base64data = file.data;
    const arrayBuffer = base64ToArrayBuffer(base64data);
    const url = window.URL.createObjectURL(new Blob([arrayBuffer]));
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Create the file size
  const fileSize = document.createElement('div');
  fileSize.className = 'file-size';
  fileSize.id = 'file-size';
  fileSize.textContent = `${file.size}`;

  // Assemble the structure
  fileHeader.appendChild(fileName);
  fileHeader.appendChild(fileDownload);

  mediaContainer.appendChild(mediaElement);
  mediaContainer.appendChild(fileHeader);
  mediaContainer.appendChild(fileSize);

  chatContent.appendChild(username);
  chatContent.appendChild(msgContent);
  chatContent.appendChild(mediaContainer);

  chatContainer.appendChild(pfpImg);
  chatContainer.appendChild(chatContent);

  // Add to chatlist
  const chatList = document.getElementById('chatlist');
  chatList.appendChild(chatContainer);
}
function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64.split(',')[1]);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}








