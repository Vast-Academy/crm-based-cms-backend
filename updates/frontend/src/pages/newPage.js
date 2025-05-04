import { useState } from 'react';
import { Bell, User, Settings, Home, Search } from 'lucide-react';

export default function SimpleUI() {
  const [count, setCount] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [tasks, setTasks] = useState([
    { id: 1, text: "वेबसाइट डिजाइन करें", completed: false },
    { id: 2, text: "रिएक्ट सीखें", completed: true },
    { id: 3, text: "प्रोजेक्ट पूरा करें", completed: false }
  ]);

  const addTask = () => {
    if (inputValue.trim() !== "") {
      setTasks([...tasks, { id: Date.now(), text: inputValue, completed: false }]);
      setInputValue("");
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">मेरा ऐप</h1>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-blue-700">
              <Bell size={20} />
            </button>
            <button className="p-2 rounded-full hover:bg-blue-700">
              <User size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-blue-700 text-white p-2">
        <div className="container mx-auto flex space-x-6">
          <a href="#" className="flex items-center p-2 hover:bg-blue-800 rounded">
            <Home size={18} className="mr-1" /> होम
          </a>
          <a href="#" className="flex items-center p-2 hover:bg-blue-800 rounded">
            <Search size={18} className="mr-1" /> खोज
          </a>
          <a href="#" className="flex items-center p-2 hover:bg-blue-800 rounded">
            <Settings size={18} className="mr-1" /> सेटिंग्स
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto p-4 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Counter Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">काउंटर</h2>
            <div className="flex items-center justify-center space-x-4">
              <button 
                onClick={() => setCount(count - 1)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                -
              </button>
              <span className="text-2xl font-bold">{count}</span>
              <button 
                onClick={() => setCount(count + 1)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                +
              </button>
            </div>
          </div>

          {/* Task Manager */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">कार्य सूची</h2>
            <div className="flex mb-4">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="नया कार्य जोड़ें..."
                className="flex-grow border border-gray-300 rounded-l p-2"
              />
              <button 
                onClick={addTask}
                className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
              >
                जोड़ें
              </button>
            </div>
            <ul className="space-y-2">
              {tasks.map(task => (
                <li 
                  key={task.id} 
                  className="flex items-center p-2 border-b border-gray-200"
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="mr-2"
                  />
                  <span className={task.completed ? "line-through text-gray-500" : ""}>
                    {task.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>© 2025 मेरा ऐप - सभी अधिकार सुरक्षित</p>
      </footer>
    </div>
  );
}