
const DB = {
  get:    ()  => JSON.parse(localStorage.getItem('tasks_v5') || '[]'),
  save:   d   => localStorage.setItem('tasks_v5', JSON.stringify(d)),
  add:    t   => { const d = DB.get(); d.unshift(t); DB.save(d); },
  toggle: id  => DB.save(DB.get().map(t => t.id === id ? {...t, done: !t.done} : t)),
  del:    id  => DB.save(DB.get().filter(t => t.id !== id))
};


let activeTab  = 'all';
let activeChip = 'all';


function render() {
  let tasks = DB.get();
  const q   = (document.getElementById('searchInput').value || '').toLowerCase();


  if (activeTab === 'today')    tasks = tasks.filter(t => !t.done && t.date === 'Today');
  if (activeTab === 'upcoming') tasks = tasks.filter(t => !t.done && ['Tomorrow','This week','Upcoming'].includes(t.date));
  if (activeTab === 'done')     tasks = tasks.filter(t => t.done);
  if (activeTab === 'schedule') tasks = tasks.filter(t => !t.done && t.date);

 
  if (activeChip !== 'all') tasks = tasks.filter(t => t.priority === activeChip);

 
  if (q) tasks = tasks.filter(t =>
    t.title.toLowerCase().includes(q) ||
    (t.note     || '').toLowerCase().includes(q) ||
    (t.category || '').toLowerCase().includes(q)
  );


  const n = DB.get().filter(t => !t.done).length;
  document.getElementById('taskCount').textContent = `${n} task${n !== 1 ? 's' : ''}`;

  const list  = document.getElementById('taskList');
  const empty = document.getElementById('emptyState');

 
  if (!tasks.length) {
    list.innerHTML = '';
    empty.style.display = 'flex';
    const msgs = {
      today:    ['No tasks today!',    'Enjoy your day or tap + to add one.'],
      upcoming: ['Nothing upcoming',       'Add a task with a future due date.'],
      done:     ['No completed tasks yet', 'Complete a task to see it here.'],
      schedule: ['No scheduled tasks',     'Add a due date to a task to see it here.'],
      all:      ['No tasks found',         'Tap the + button to add your first task!']
    };
    const [title, msg] = msgs[activeTab] || msgs.all;
    document.getElementById('emptyTitle').textContent = title;
    document.getElementById('emptyMsg').textContent   = msg;
    return;
  }

  empty.style.display = 'none';


  const ORDER  = ['Today', 'Tomorrow', 'This week', 'Upcoming', 'No Date', '✅ Completed'];
  const groups = {};
  tasks.forEach(t => {
    const key = t.done ? '✅ Completed' : (t.date || 'No Date');
    (groups[key] = groups[key] || []).push(t);
  });

  list.innerHTML = '';
  Object.keys(groups)
    .sort((a, b) => {
      const ai = ORDER.indexOf(a), bi = ORDER.indexOf(b);
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    })
    .forEach(key => {
      
      const lbl = document.createElement('div');
      lbl.className   = 'sec-label';
      lbl.textContent = key;
      list.appendChild(lbl);

     
      const grp = document.createElement('div');
      grp.className = 'task-group';
      groups[key].forEach(t => grp.appendChild(makeCard(t)));
      list.appendChild(grp);
    });
}


function makeCard(t) {
  const el = document.createElement('div');
  el.className = `task-card ${t.priority || 'medium'}`;
  el.innerHTML = `
    <div class="check ${t.done ? 'checked' : ''}" onclick="toggle('${t.id}')"></div>
    <div class="task-text">
      <div class="task-title ${t.done ? 'done' : ''}">${esc(t.title)}</div>
      <div class="task-pills">
        ${t.category ? `<span class="pill">📂 ${esc(t.category)}</span>` : ''}
        ${t.date     ? `<span class="pill">📅 ${t.date}</span>`          : ''}
        ${t.note     ? `<span class="pill">· ${esc(t.note)}</span>`      : ''}
      </div>
    </div>
    <button class="del-btn" onclick="remove('${t.id}')">✕</button>`;
  return el;
}


const esc = s => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');


function toggle(id) { DB.toggle(id); render(); }
function remove(id) { DB.del(id);    render(); }


function openModal() {
  document.getElementById('overlay').style.display = 'flex';
  setTimeout(() => document.getElementById('fTitle').focus(), 350);
}

function closeModal() {
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('fTitle').value    = '';
  document.getElementById('fNote').value     = '';
  document.getElementById('fDate').value     = 'Today';
  document.getElementById('fPriority').value = 'medium';
  document.getElementById('fCategory').value = 'School';
}

function closeIfOutside(e) {
  if (e.target === document.getElementById('overlay')) closeModal();
}

function submit() {
  const inp   = document.getElementById('fTitle');
  const title = inp.value.trim();

  if (!title) {
    inp.classList.add('err');
    inp.placeholder = 'Please enter a title!';
    setTimeout(() => {
      inp.classList.remove('err');
      inp.placeholder = 'What needs to be done?';
    }, 1500);
    return;
  }

  DB.add({
    id:       Date.now().toString(),
    title,
    note:     document.getElementById('fNote').value.trim(),
    date:     document.getElementById('fDate').value,
    priority: document.getElementById('fPriority').value,
    category: document.getElementById('fCategory').value,
    done:     false,
    created:  new Date().toISOString()
  });

  closeModal();
  render();
}


function setTab(btn, tab, title) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeTab  = tab;
  activeChip = 'all';

  document.getElementById('pageTitle').textContent = title;
  document.getElementById('searchInput').value     = '';

  
  const showChips = ['all', 'today', 'upcoming'].includes(tab);
  document.getElementById('chipsRow').style.display = showChips ? 'flex' : 'none';

  
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  document.querySelector('.chip')?.classList.add('active');

  render();
}

function setChip(btn, chip) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  activeChip = chip;
  render();
}
render();
