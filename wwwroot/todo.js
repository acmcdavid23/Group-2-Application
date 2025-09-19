// Todo list management
let todoLists = [];
let nextListId = 1;

// DOM elements
let welcomeSection = document.getElementById('welcomeSection');
let todoListsContainer = document.getElementById('todoListsContainer');
let startNewBtn = document.getElementById('startNewBtn');
let welcomeStartBtn = document.getElementById('welcomeStartBtn');
let newListModal = document.getElementById('newListModal');
let newListForm = document.getElementById('newListForm');
let cancelNewList = document.getElementById('cancelNewList');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing todo lists...');
    
    // Load saved lists
    loadTodoLists();
    
    // Event listeners
    startNewBtn.addEventListener('click', openNewListModal);
    welcomeStartBtn.addEventListener('click', openNewListModal);
    cancelNewList.addEventListener('click', closeNewListModal);
    newListForm.addEventListener('submit', createNewList);
    
    // Close modal when clicking outside
    newListModal.addEventListener('click', (e) => {
        if (e.target === newListModal) {
            closeNewListModal();
        }
    });
    
    // Render initial state
    renderTodoLists();
});

// Load todo lists from localStorage
function loadTodoLists() {
    try {
        const saved = localStorage.getItem('todo-lists');
        if (saved) {
            todoLists = JSON.parse(saved);
            // Set next ID based on existing lists
            if (todoLists.length > 0) {
                nextListId = Math.max(...todoLists.map(list => list.id)) + 1;
            }
        }
    } catch (error) {
        console.error('Failed to load todo lists:', error);
        todoLists = [];
    }
}

// Save todo lists to localStorage
function saveTodoLists() {
    try {
        localStorage.setItem('todo-lists', JSON.stringify(todoLists));
    } catch (error) {
        console.error('Failed to save todo lists:', error);
    }
}

// Open new list modal
function openNewListModal() {
    newListForm.reset();
    // Set default date to today
    document.getElementById('listDate').value = new Date().toISOString().split('T')[0];
    newListModal.style.display = 'flex';
}

// Close new list modal
function closeNewListModal() {
    newListModal.style.display = 'none';
}

// Create new todo list
function createNewList(e) {
    e.preventDefault();
    
    const formData = new FormData(newListForm);
    const title = formData.get('title');
    const date = formData.get('date');
    
    if (!title || !date) {
        alert('Please fill in all fields');
        return;
    }
    
    const newList = {
        id: nextListId++,
        title: title,
        date: date,
        items: [],
        createdAt: new Date().toISOString()
    };
    
    todoLists.push(newList);
    saveTodoLists();
    renderTodoLists();
    closeNewListModal();
}

// Render all todo lists
function renderTodoLists() {
    if (todoLists.length === 0) {
        // Show welcome section
        welcomeSection.style.display = 'block';
        todoListsContainer.style.display = 'none';
        startNewBtn.style.display = 'none';
    } else {
        // Show todo lists
        welcomeSection.style.display = 'none';
        todoListsContainer.style.display = 'block';
        startNewBtn.style.display = 'inline-block';
        
        // Clear container
        todoListsContainer.innerHTML = '';
        
        // Sort lists by date (upcoming first)
        const sortedLists = [...todoLists].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Render each list
        sortedLists.forEach(list => {
            const listElement = createTodoListElement(list);
            todoListsContainer.appendChild(listElement);
        });
    }
}

// Create todo list element
function createTodoListElement(list) {
    const listCard = document.createElement('div');
    listCard.className = 'todo-list-card';
    listCard.dataset.listId = list.id;
    
    // Format date
    const date = new Date(list.date);
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    listCard.innerHTML = `
        <div class="todo-list-header">
            <div>
                <h3 class="todo-list-title">${escapeHtml(list.title)}</h3>
                <div class="todo-list-date">Due: ${formattedDate}</div>
            </div>
            <div class="todo-list-actions">
                <button class="delete-list-btn" data-list-id="${list.id}">Delete</button>
            </div>
        </div>
        
        <div class="add-item-form">
            <input type="text" class="add-item-input" placeholder="Add new item..." data-list-id="${list.id}">
            <button class="add-item-btn" data-list-id="${list.id}">Add</button>
        </div>
        
        <ul class="todo-items" data-list-id="${list.id}">
            ${list.items.map(item => createTodoItemHTML(item, list.id)).join('')}
        </ul>
    `;
    
    // Add event listeners
    addTodoListEventListeners(listCard, list.id);
    
    return listCard;
}

// Create todo item HTML
function createTodoItemHTML(item, listId) {
    const checkedClass = item.completed ? 'checked' : '';
    const completedClass = item.completed ? 'completed' : '';
    
    return `
        <li class="todo-item">
            <div class="todo-checkbox ${checkedClass}" data-item-id="${item.id}" data-list-id="${listId}"></div>
            <span class="todo-item-text ${completedClass}">${escapeHtml(item.text)}</span>
            <button class="todo-item-delete" data-item-id="${item.id}" data-list-id="${listId}">×</button>
        </li>
    `;
}

// Add event listeners to todo list
function addTodoListEventListeners(listCard, listId) {
    // Add item button
    const addBtn = listCard.querySelector('.add-item-btn');
    const addInput = listCard.querySelector('.add-item-input');
    
    addBtn.addEventListener('click', () => addTodoItem(listId, addInput));
    addInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodoItem(listId, addInput);
        }
    });
    
    // Delete list button
    const deleteBtn = listCard.querySelector('.delete-list-btn');
    deleteBtn.addEventListener('click', () => deleteTodoList(listId));
    
    // Todo item checkboxes and delete buttons
    const checkboxes = listCard.querySelectorAll('.todo-checkbox');
    const deleteButtons = listCard.querySelectorAll('.todo-item-delete');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('click', () => toggleTodoItem(listId, parseInt(checkbox.dataset.itemId)));
    });
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => deleteTodoItem(listId, parseInt(button.dataset.itemId)));
    });
}

// Add new todo item
function addTodoItem(listId, inputElement) {
    const text = inputElement.value.trim();
    if (!text) return;
    
    const list = todoLists.find(l => l.id === listId);
    if (!list) return;
    
    const newItem = {
        id: Date.now(), // Simple ID generation
        text: text,
        completed: false
    };
    
    list.items.push(newItem);
    saveTodoLists();
    renderTodoLists();
}

// Toggle todo item completion
function toggleTodoItem(listId, itemId) {
    const list = todoLists.find(l => l.id === listId);
    if (!list) return;
    
    const item = list.items.find(i => i.id === itemId);
    if (!item) return;
    
    item.completed = !item.completed;
    saveTodoLists();
    renderTodoLists();
}

// Delete todo item
function deleteTodoItem(listId, itemId) {
    const list = todoLists.find(l => l.id === listId);
    if (!list) return;
    
    const itemIndex = list.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;
    
    list.items.splice(itemIndex, 1);
    saveTodoLists();
    renderTodoLists();
}

// Delete entire todo list
function deleteTodoList(listId) {
    if (!confirm('Are you sure you want to delete this entire list? This action cannot be undone.')) {
        return;
    }
    
    const listIndex = todoLists.findIndex(l => l.id === listId);
    if (listIndex === -1) return;
    
    todoLists.splice(listIndex, 1);
    saveTodoLists();
    renderTodoLists();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
