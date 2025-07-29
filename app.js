 (() => {
      // Elements
      const taskForm = document.getElementById('taskForm');
      const titleInput = document.getElementById('titleInput');
      const categoryInput = document.getElementById('categoryInput');
      const priorityInput = document.getElementById('priorityInput');
      const statusInput = document.getElementById('statusInput');
      const startDateInput = document.getElementById('startDateInput');
      const dueDateInput = document.getElementById('dueDateInput');
      const descriptionInput = document.getElementById('descriptionInput');
      const submitBtn = document.getElementById('submitBtn');

      const filterStatus = document.getElementById('filterStatus');
      const filterPriority = document.getElementById('filterPriority');
      const filterCategory = document.getElementById('filterCategory');
      const tasksContainer = document.getElementById('tasksContainer');

      // State
      let tasks = [];
      let editTaskId = null;

      // Helpers
      const saveTasks = () => {
        localStorage.setItem('advancedTasks', JSON.stringify(tasks));
      };

      const loadTasks = () => {
        const stored = localStorage.getItem('advancedTasks');
        tasks = stored ? JSON.parse(stored) : [];
      };

      const generateId = () => {
        return '_' + Math.random().toString(36).substr(2, 9);
      };

      const formatDate = (dateStr) => {
        if (!dateStr) return "No date";
        // Parse date without timezone confusion:
        const d = new Date(dateStr + 'T00:00:00');
        if (isNaN(d)) return "Invalid date";
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      };

      const isOverdue = (dueDate, status) => {
        if (!dueDate || status === 'completed') return false;
        const today = new Date();
        const due = new Date(dueDate + 'T23:59:59');
        return due < today;
      };

      // Filter Categories options based on tasks dynamically
      const updateCategoriesFilterOptions = () => {
        const categories = [...new Set(tasks.map(t => t.category).filter(c => c && c.trim() !== ''))];
        filterCategory.innerHTML = '<option value="all" selected>All Categories</option>';
        categories.forEach(cat => {
          const option = document.createElement('option');
          option.value = cat;
          option.textContent = cat;
          filterCategory.appendChild(option);
        });
      };

      // Render

      function createTaskCard(task) {
        const priorityClasses = {
          high: 'priority-high',
          medium: 'priority-medium',
          low: 'priority-low'
        };
        const statusClasses = {
          'not-started': 'status-not-started',
          'in-progress': 'status-in-progress',
          'completed': 'status-completed'
        };

        const overdueClass = isOverdue(task.dueDate, task.status) ? 'overdue' : '';

        let borderColor = '#bbb';
        switch (task.priority) {
          case 'high': borderColor = '#d93025'; break;
          case 'medium': borderColor = '#f9ab00'; break;
          case 'low': borderColor = '#188038'; break;
        }

        return `
          <div class="task-card" data-id="${task.id}" style="border-left-color: ${borderColor};">
            <div class="task-top">
              <div>
                <span class="task-title ${statusClasses[task.status]}">${escapeHtml(task.title)}</span>
                ${task.category ? `<span class="task-category">${escapeHtml(task.category)}</span>` : ''}
              </div>
              <button class="status-btn ${task.status}" title="Change status">↻</button>
            </div>
            <div class="task-desc">${escapeHtml(task.description || '')}</div>
            <div class="task-meta" aria-label="Task metadata">
              <div><span class="meta-label">Priority:</span> <span class="${priorityClasses[task.priority]}">${capitalize(task.priority)}</span></div>
              <div><span class="meta-label">Start:</span> <span>${formatDate(task.startDate)}</span></div>
              <div><span class="meta-label">Due:</span> <span class="${overdueClass}">${formatDate(task.dueDate)}</span></div>
              <div><span class="meta-label">Status:</span> <span>${capitalize(task.status.replace('-', ' '))}</span></div>
            </div>
            <div class="task-actions">
              <button aria-label="Edit task" class="edit-btn">Edit</button>
              <button aria-label="Delete task" class="delete-btn">Delete</button>
            </div>
          </div>
        `;
      }

      const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

      // Escape HTML to prevent injection
      function escapeHtml(text) {
        if (!text) return '';
        return text.replace(/[&<>"']/g, (m) => {
          return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
          })[m];
        });
      }

      function renderTasks() {
        const statusFilter = filterStatus.value;
        const priorityFilter = filterPriority.value;
        const categoryFilter = filterCategory.value;

        let filtered = tasks.filter(task => {
          if (statusFilter !== 'all' && task.status !== statusFilter) return false;
          if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
          if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;
          return true;
        });

        if (filtered.length === 0) {
          tasksContainer.innerHTML = `<p style="padding: 20px; color:#666; text-align:center;">No matching tasks. </p>`;
          return;
        }
        tasksContainer.innerHTML = filtered.map(createTaskCard).join('');
      }

      // Reset form to default state
      const resetForm = () => {
        taskForm.reset();
        submitBtn.textContent = 'Add Task';
        editTaskId = null;
      };

      // Load task data into form for editing
      const loadTaskToForm = (task) => {
        titleInput.value = task.title;
        categoryInput.value = task.category || '';
        priorityInput.value = task.priority || 'medium';
        statusInput.value = task.status || 'not-started';
        startDateInput.value = task.startDate || '';
        dueDateInput.value = task.dueDate || '';
        descriptionInput.value = task.description || '';
        submitBtn.textContent = 'Update Task';
      };

      // Handlers

      taskForm.addEventListener('submit', e => {
        e.preventDefault();

        const title = titleInput.value.trim();
        if (!title) {
          alert('Please enter a task title.');
          return;
        }

        const startDate = startDateInput.value || '';
        const dueDate = dueDateInput.value || '';

        // Validate that startDate is not after dueDate (if both provided)
        if (startDate && dueDate && new Date(startDate) > new Date(dueDate)) {
          alert('Start Date cannot be after Due Date.');
          return;
        }

        const newTaskData = {
          title,
          category: categoryInput.value.trim() || '',
          priority: priorityInput.value,
          status: statusInput.value,
          startDate,
          dueDate,
          description: descriptionInput.value.trim() || '',
        };

        if (editTaskId) {
          const idx = tasks.findIndex(t => t.id === editTaskId);
          if (idx !== -1) {
            tasks[idx] = { ...tasks[idx], ...newTaskData, updatedAt: new Date().toISOString() };
          }
          alert('Task updated.');
        } else {
          const newTask = {
            id: generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...newTaskData
          };
          tasks.push(newTask);
          alert('Task added.');
        }
        saveTasks();
        updateCategoriesFilterOptions();
        renderTasks();
        resetForm();
      });

      // Delegate clicks on tasks container (edit/delete/status change)
      tasksContainer.addEventListener('click', e => {
        const card = e.target.closest('.task-card');
        if (!card) return;

        const taskId = card.dataset.id;
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;
        const task = tasks[taskIndex];

        if (e.target.classList.contains('edit-btn')) {
          loadTaskToForm(task);
          editTaskId = taskId;
          taskForm.scrollIntoView({ behavior: 'smooth' });
          return;
        }
        if (e.target.classList.contains('delete-btn')) {
          if (confirm(`Delete task "${task.title}"?`)) {
            tasks.splice(taskIndex, 1);
            saveTasks();
            updateCategoriesFilterOptions();
            renderTasks();
            if (editTaskId === taskId) resetForm();
          }
          return;
        }
        if (e.target.classList.contains('status-btn')) {
          const statusCycle = ['not-started', 'in-progress', 'completed'];
          const currentIndex = statusCycle.indexOf(task.status);
          const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
          tasks[taskIndex].status = nextStatus;
          tasks[taskIndex].updatedAt = new Date().toISOString();
          saveTasks();
          renderTasks();
          return;
        }
      });

      filterStatus.addEventListener('change', renderTasks);
      filterPriority.addEventListener('change', renderTasks);
      filterCategory.addEventListener('change', renderTasks);

      // Initialize
      loadTasks();
      updateCategoriesFilterOptions();
      renderTasks();
    })();