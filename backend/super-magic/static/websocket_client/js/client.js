// 全局变量
let socket = null;
let isConnected = false;
let currentFileName = ""; // 存储当前上传的文件名
let messageHistory = []; // 存储用户发送过的消息历史
let currentTaskMode = "plan"; // 当前任务模式，默认为 plan

// 定义示例文本常量
const EXAMPLE_TEXT = "我需要4月15日至23日从广东出发的北京7天行程，我和未婚妻的预算是2500-5000人民币。我们喜欢历史遗迹、隐藏的宝石和中国文化。我们想看看北京的长城，徒步探索城市。我打算在这次旅行中求婚，需要一个特殊的地点推荐。请提供详细的行程和简单的HTML旅行手册，包括地图，景点描述，必要的旅行提示，我们可以在整个旅程中参考。";

// DOM 元素
const serverUrlInput = document.getElementById('serverUrl');
const connectBtn = document.getElementById('connectBtn');
const connectionStatus = document.getElementById('connectionStatus');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const followUpBtn = document.getElementById('followUpBtn');
const interruptBtn = document.getElementById('interruptBtn');
const loadExampleBtn = document.getElementById('loadExampleBtn');
const messageList = document.getElementById('messageList');
const uploadConfigContent = document.getElementById('uploadConfigContent');
const configFileInput = document.getElementById('configFile');
const currentFileNameDisplay = document.getElementById('currentFileName');
const modeToggle = document.getElementById('modeToggle');

// 消息类型枚举
const MessageType = {
    CHAT: "chat",
    INIT: "init"
};

// 上下文类型枚举
const ContextType = {
    NORMAL: "normal",
    FOLLOW_UP: "follow_up",
    INTERRUPT: "interrupt"
};

// 任务模式枚举
const TaskMode = {
    CHAT: "chat",
    PLAN: "plan"
};

// 初始化事件监听
document.addEventListener('DOMContentLoaded', () => {
    // 先加载历史记录
    loadMessageHistory();
    console.log("DOM加载完成，已加载历史记录，数量:", messageHistory.length);
    
    // 连接按钮事件
    connectBtn.addEventListener('click', connectToServer);
    
    // 初始化消息按钮事件
    const sendInitBtn = document.getElementById('sendInitBtn');
    if (sendInitBtn) {
        sendInitBtn.addEventListener('click', sendInitMessage);
    }
    
    // 消息发送按钮事件
    sendBtn.addEventListener('click', () => sendMessage(ContextType.NORMAL));
    
    // 追问按钮事件
    followUpBtn.addEventListener('click', () => sendMessage(ContextType.FOLLOW_UP));
    
    // 中断按钮事件
    interruptBtn.addEventListener('click', () => sendInterrupt());
    
    // 加载示例文本按钮事件
    loadExampleBtn.addEventListener('click', loadExampleText);
    
    // 模式切换事件
    modeToggle.addEventListener('click', toggleTaskMode);
    
    // 初始化任务模式为 Plan 模式
    const toggleContainer = document.getElementById('modeToggle');
    const planOption = toggleContainer.querySelector('.toggle-option.plan');
    const chatOption = toggleContainer.querySelector('.toggle-option.chat');
    
    toggleContainer.classList.add('plan-active');
    planOption.classList.add('active');
    chatOption.classList.remove('active');
    
    // 历史消息按钮事件
    const historyButton = document.getElementById('historyBtn');
    if (historyButton) {
        console.log("找到历史按钮，添加事件监听");
        historyButton.addEventListener('click', function(e) {
            console.log("历史按钮被点击");
            e.preventDefault();
            e.stopPropagation();
            
            // 使用toggleHistoryDropdown函数来显示历史记录，这样会正确添加点击外部关闭的事件监听器
            toggleHistoryDropdown(true);
            showMessageHistory();
            return false;
        });
    } else {
        console.error("找不到历史按钮!");
    }
    
    // 配置文件上传事件
    configFileInput.addEventListener('change', handleConfigFileUpload);
    
    // 禁用消息按钮，直到连接建立
    toggleMessageControls(false);
    
    // 设置上传凭证默认配置
    setupDefaultConfigs();
    
    // 初始隐藏文件名显示
    currentFileNameDisplay.style.display = 'none';
});

// 设置默认配置
function setupDefaultConfigs() {
    // 不再提供默认配置，只显示提示信息
    uploadConfigContent.value = "请上传配置文件";
    
    // 禁用文本区域编辑，强制通过文件上传
    uploadConfigContent.readOnly = true;
}

// 连接到WebSocket服务器
async function connectToServer() {
    const serverUrl = serverUrlInput.value.trim();
    if (!serverUrl) {
        showSystemMessage("请输入服务器地址");
        return;
    }
    
    // 检查是否已上传配置文件
    if (!uploadConfigContent.value.trim()) {
        showSystemMessage("请先上传配置文件");
        return;
    }
    
    // 更新连接状态
    setConnectionStatus('connecting', '正在连接...');
    
    try {
        // 创建WebSocket连接
        socket = new WebSocket(serverUrl);
        
        // WebSocket事件处理
        socket.onopen = handleSocketOpen;
        socket.onmessage = handleSocketMessage;
        socket.onerror = handleSocketError;
        socket.onclose = handleSocketClose;
    } catch (err) {
        setConnectionStatus('error', '连接失败');
        showSystemMessage(`连接服务器失败: ${err.message}`);
    }
}

// 从文本区域解析JSON
function parseJsonConfigFromTextarea(textarea) {
    try {
        const jsonText = textarea.value.trim();
        if (!jsonText) {
            return null;
        }
        return JSON.parse(jsonText);
    } catch (err) {
        throw new Error(`JSON格式错误: ${err.message}`);
    }
}

// 处理WebSocket连接打开
function handleSocketOpen() {
    setConnectionStatus('connected', '已连接');
    showSystemMessage("连接成功！");
    showSystemMessage("你可以选择点击'发送初始化消息'按钮来初始化工作区，或者直接发送聊天消息");
    
    // 直接启用消息控件，不再等待init响应
    toggleMessageControls(true);
}

// 处理WebSocket消息接收
function handleSocketMessage(event) {
    try {
        const response = JSON.parse(event.data);
        
        // 显示服务器消息
        showServerMessage(response);
        
        // 处理错误消息
        if (response.payload && response.payload.type === "error") {
            showSystemMessage(`服务器错误: ${response.payload.content || '未知错误'}`);
        }
    } catch (err) {
        showSystemMessage(`解析服务器消息失败: ${err.message}`);
    }
}

// 处理WebSocket错误
function handleSocketError(error) {
    setConnectionStatus('error', '连接错误');
    showSystemMessage(`WebSocket错误: ${error.message || '未知错误'}`);
}

// 处理WebSocket连接关闭
function handleSocketClose(event) {
    isConnected = false;
    setConnectionStatus('', '未连接');
    
    let message = "连接已关闭";
    if (event.code !== 1000) {
        message += ` (代码: ${event.code}`;
        if (event.reason) {
            message += `, 原因: ${event.reason})`;
        } else {
            message += ')';
        }
    }
    
    showSystemMessage(message);
    toggleMessageControls(false);
}

// 从localStorage加载历史记录
function loadMessageHistory() {
  console.log("尝试从localStorage加载历史记录");
  const savedHistory = localStorage.getItem('messageHistory');
  if (savedHistory) {
    try {
      messageHistory = JSON.parse(savedHistory);
      console.log("成功加载历史记录，数量:", messageHistory.length);
    } catch (err) {
      console.error('解析历史记录失败:', err);
      messageHistory = [];
    }
  } else {
    console.log("localStorage中没有保存的历史记录");
    messageHistory = [];
  }
}

// 保存消息到历史记录
function saveMessageToHistory(message) {
  try {
    console.log("保存消息到历史:", message);
    
    // 检查消息是否已存在于历史记录
    const existingIndex = messageHistory.indexOf(message);
    if (existingIndex !== -1) {
      // 如果消息已存在，将其从当前位置移除
      messageHistory.splice(existingIndex, 1);
      console.log(`消息"${message}"已存在，已从位置${existingIndex}移除`);
    }
    
    // 将消息添加到历史记录最前面
    messageHistory.push(message);
    
    // 限制历史记录数量
    if (messageHistory.length > 50) {
      messageHistory.shift();
    }
    
    // 存储到localStorage
    localStorage.setItem('messageHistory', JSON.stringify(messageHistory));
    console.log("保存成功，当前历史记录数量:", messageHistory.length);
  } catch (err) {
    console.error("保存历史记录失败:", err);
  }
}

// 清空历史记录
function clearMessageHistory() {
  messageHistory = [];
  localStorage.removeItem('messageHistory');
  showSystemMessage("历史记录已清空");
}

// 删除单条历史记录
function deleteHistoryItem(index) {
  // 从历史记录数组中删除指定索引的消息
  messageHistory.splice(index, 1);
  // 更新localStorage
  localStorage.setItem('messageHistory', JSON.stringify(messageHistory));
  // 重新显示历史记录
  showMessageHistory();
  showSystemMessage("已删除该条历史记录");
}

// 显示确认对话框
function showConfirmDialog(message, confirmCallback, cancelCallback = null) {
  // 创建确认对话框背景遮罩
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  
  // 创建确认对话框
  const dialog = document.createElement('div');
  dialog.className = 'confirm-dialog';
  
  // 创建消息文本
  const messageText = document.createElement('div');
  messageText.className = 'confirm-message';
  messageText.textContent = message;
  
  // 创建按钮容器
  const btnContainer = document.createElement('div');
  btnContainer.className = 'confirm-buttons';
  
  // 创建确认按钮
  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn primary';
  confirmBtn.textContent = '确认';
  
  // 创建取消按钮
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn secondary';
  cancelBtn.textContent = '取消';
  
  // 添加按钮事件
  confirmBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
    if (confirmCallback) confirmCallback();
  });
  
  cancelBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
    if (cancelCallback) cancelCallback();
  });
  
  // 组装对话框
  btnContainer.appendChild(cancelBtn);
  btnContainer.appendChild(confirmBtn);
  
  dialog.appendChild(messageText);
  dialog.appendChild(btnContainer);
  
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

// 编辑历史消息
function editHistoryItem(index) {
  // 获取当前消息内容
  const currentMessage = messageHistory[index];
  
  // 创建编辑框，预填充当前消息内容
  const editInput = document.createElement('textarea');
  editInput.className = 'edit-history-input';
  editInput.value = currentMessage;
  
  // 创建保存按钮
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn primary small';
  saveBtn.textContent = '保存';
  
  // 创建取消按钮
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn secondary small';
  cancelBtn.textContent = '取消';
  
  // 保存编辑后的消息
  function saveEdit() {
    const newMessage = editInput.value.trim();
    if (newMessage) {
      // 更新历史记录
      messageHistory[index] = newMessage;
      // 更新localStorage
      localStorage.setItem('messageHistory', JSON.stringify(messageHistory));
      // 重新显示历史记录
      showMessageHistory();
      showSystemMessage("历史消息已更新");
    }
  }
  
  // 绑定保存和取消按钮事件
  saveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    saveEdit();
  });
  
  cancelBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showMessageHistory(); // 取消编辑，重新显示历史记录
  });
  
  // 获取当前历史项，替换为编辑界面
  const historyItem = document.querySelector(`.history-item[data-index="${index}"]`);
  historyItem.innerHTML = '';
  historyItem.appendChild(editInput);
  
  // 创建按钮容器
  const btnContainer = document.createElement('div');
  btnContainer.className = 'edit-btn-container';
  btnContainer.appendChild(saveBtn);
  btnContainer.appendChild(cancelBtn);
  
  historyItem.appendChild(btnContainer);
  
  // 自动聚焦到编辑框
  editInput.focus();
}

// 显示历史消息的函数
function showMessageHistory() {
  const historyDropdown = document.getElementById('messageHistoryDropdown');
  historyDropdown.innerHTML = '';
  
  // 添加历史记录标题
  const titleDiv = document.createElement('div');
  titleDiv.className = 'history-title';
  titleDiv.textContent = '历史消息记录';
  historyDropdown.appendChild(titleDiv);
  
  // 添加历史控制按钮
  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'history-controls';
  
  // 清空按钮
  const clearBtn = document.createElement('button');
  clearBtn.id = 'clearHistoryBtn';
  clearBtn.className = 'btn danger small';
  clearBtn.textContent = '清空历史';
  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // 显示确认对话框
    showConfirmDialog('确定要清空所有历史记录吗？', () => {
      // 用户确认后执行清空操作
      clearMessageHistory();
      showMessageHistory();
    });
  });
  
  controlsDiv.appendChild(clearBtn);
  historyDropdown.appendChild(controlsDiv);
  
  if (messageHistory.length === 0) {
    const emptyItem = document.createElement('div');
    emptyItem.className = 'history-item empty';
    emptyItem.textContent = '没有历史消息';
    historyDropdown.appendChild(emptyItem);
    return;
  }
  
  // 从最新的消息开始显示
  for (let i = messageHistory.length - 1; i >= 0; i--) {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.setAttribute('data-index', i); // 设置索引属性，方便编辑时定位
    
    // 创建消息文本元素
    const messageText = document.createElement('span');
    messageText.className = 'message-text';
    messageText.textContent = messageHistory[i];
    messageText.addEventListener('click', () => {
      messageInput.value = messageHistory[i];
      toggleHistoryDropdown(false);
    });
    
    // 创建按钮容器
    const btnContainer = document.createElement('div');
    btnContainer.className = 'history-btn-container';
    
    // 创建编辑按钮
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.innerHTML = '✎'; // 编辑符号
    editBtn.title = "编辑此条记录";
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      editHistoryItem(i);
    });
    
    // 创建删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '&times;'; // × 符号
    deleteBtn.title = "删除此条记录";
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // 显示确认对话框
      showConfirmDialog('确定要删除这条历史记录吗？', () => {
        // 用户确认后执行删除操作
        deleteHistoryItem(i);
      });
    });
    
    btnContainer.appendChild(editBtn);
    btnContainer.appendChild(deleteBtn);
    
    historyItem.appendChild(messageText);
    historyItem.appendChild(btnContainer);
    historyDropdown.appendChild(historyItem);
  }
}

// 切换历史下拉框的显示状态
function toggleHistoryDropdown(show) {
  const dropdown = document.getElementById('messageHistoryDropdown');
  if (show) {
    dropdown.style.display = 'block';
    dropdown.classList.add('show');
    
    // 点击其他地方关闭下拉框
    setTimeout(() => {
      document.addEventListener('click', closeHistoryDropdownOnClickOutside);
    }, 100); // 短暂延迟，避免立即触发关闭
  } else {
    dropdown.style.display = 'none';
    dropdown.classList.remove('show');
    document.removeEventListener('click', closeHistoryDropdownOnClickOutside);
  }
}

// 点击外部关闭历史下拉框
function closeHistoryDropdownOnClickOutside(event) {
  const dropdown = document.getElementById('messageHistoryDropdown');
  const historyBtn = document.getElementById('historyBtn');
  
  // 只要点击的不是下拉框本身和历史按钮，就关闭下拉框
  if (!dropdown.contains(event.target) && event.target !== historyBtn) {
    toggleHistoryDropdown(false);
  }
}

// 修改sendMessage函数，添加保存历史记录的功能
function sendMessage(contextType = ContextType.NORMAL) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        showSystemMessage("未连接到服务器");
        return;
    }
    
    const text = messageInput.value.trim();
    if (!text && contextType !== ContextType.INTERRUPT) {
        showSystemMessage("请输入消息内容");
        return;
    }
    
    // 创建消息
    const message = createChatMessage(text, contextType);
    
    // 发送消息
    socket.send(JSON.stringify(message));
    
    // 显示已发送的消息并保存历史
    if (text) {
        showClientMessage(message);
        
        // 保存到历史记录
        saveMessageToHistory(text);
        
        messageInput.value = '';
    } else if (contextType === ContextType.INTERRUPT) {
        showSystemMessage("已发送中断消息");
    }
}

// 发送中断消息
function sendInterrupt() {
    sendMessage(ContextType.INTERRUPT);
}

// 处理配置文件上传
function handleConfigFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const fileContent = e.target.result;
            // 只解析验证格式是否正确，保留原始内容
            JSON.parse(fileContent); // 只验证是否为有效的JSON
            
            // 存储原始配置文本
            uploadConfigContent.value = fileContent;
            
            // 更新并显示当前文件名
            currentFileName = file.name;
            updateFileNameDisplay();
            
            showSystemMessage(`配置文件 "${file.name}" 已加载`);
        } catch (err) {
            showSystemMessage(`配置文件解析失败: ${err.message}`);
        }
        
        // 重置文件输入控件的值，允许重新选择同一文件
        configFileInput.value = '';
    };
    
    reader.readAsText(file);
}

// 添加更新文件名显示的函数
function updateFileNameDisplay() {
    if (currentFileName) {
        currentFileNameDisplay.textContent = `当前文件: ${currentFileName}`;
        currentFileNameDisplay.style.display = 'block';
    } else {
        currentFileNameDisplay.style.display = 'none';
    }
}

// 创建聊天消息
function createChatMessage(prompt, contextType = ContextType.NORMAL) {
    return {
        message_id: generateUUID(),
        type: MessageType.CHAT,
        prompt: prompt,
        context_type: contextType,
        task_mode: currentTaskMode
    };
}

// 生成UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 设置连接状态
function setConnectionStatus(className, text) {
    connectionStatus.className = 'status ' + className;
    connectionStatus.textContent = text;
    isConnected = className === 'connected';
}

// 启用/禁用消息控件
function toggleMessageControls(enabled) {
    messageInput.disabled = !enabled;
    sendBtn.disabled = !enabled;
    followUpBtn.disabled = !enabled;
    interruptBtn.disabled = !enabled;
    
    // 控制初始化按钮状态
    const sendInitBtn = document.getElementById('sendInitBtn');
    if (sendInitBtn) {
        sendInitBtn.disabled = !enabled;
    }
}

// 显示客户端消息
function showClientMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message client';
    
    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';
    messageHeader.textContent = `客户端消息 (${new Date().toLocaleTimeString()}) - 模式: ${message.task_mode.toUpperCase()}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = message.prompt;
    
    messageDiv.appendChild(messageHeader);
    messageDiv.appendChild(messageContent);
    messageList.appendChild(messageDiv);
    
    scrollToBottom();
}

// 显示服务器消息
function showServerMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message server';
    
    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';
    messageHeader.textContent = `服务器消息 (${new Date().toLocaleTimeString()})`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = JSON.stringify(message, null, 2);
    
    messageDiv.appendChild(messageHeader);
    messageDiv.appendChild(messageContent);
    messageList.appendChild(messageDiv);
    
    scrollToBottom();
}

// 显示系统消息
function showSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = text;
    
    messageDiv.appendChild(messageContent);
    messageList.appendChild(messageDiv);
    
    scrollToBottom();
}

// 滚动到消息列表底部
function scrollToBottom() {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 加载示例文本到输入框
function loadExampleText() {
    messageInput.value = EXAMPLE_TEXT;
}

// 发送初始化消息
function sendInitMessage() {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        showSystemMessage("未连接到服务器");
        return;
    }
    
    // 发送配置文件内容作为WebSocket消息
    const configText = uploadConfigContent.value;
    socket.send(configText);
    
    showSystemMessage("已发送工作区初始化消息，等待服务器响应...");
}

// 切换任务模式
function toggleTaskMode() {
    const toggleContainer = document.getElementById('modeToggle');
    const planOption = toggleContainer.querySelector('.toggle-option.plan');
    const chatOption = toggleContainer.querySelector('.toggle-option.chat');
    
    if (currentTaskMode === "chat") {
        currentTaskMode = "plan";
        toggleContainer.classList.add('plan-active');
        planOption.classList.add('active');
        chatOption.classList.remove('active');
    } else {
        currentTaskMode = "chat";
        toggleContainer.classList.remove('plan-active');
        chatOption.classList.add('active');
        planOption.classList.remove('active');
    }
    
    showSystemMessage(`当前任务模式已切换为: ${currentTaskMode.toUpperCase()} 模式`);
} 