import { Hono } from 'hono';

const preview = new Hono();

preview.get('/dashboard', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WorVox Dashboard Design Options</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background: #f7f7f8; }
        .design-switcher { position: fixed; top: 20px; right: 20px; z-index: 1000; background: white; padding: 15px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .design-switcher button { display: block; width: 100%; padding: 10px 20px; margin: 5px 0; border: 2px solid #e5e5e5; border-radius: 8px; background: white; cursor: pointer; transition: all 0.2s; font-weight: 600; }
        .design-switcher button:hover { border-color: #10a37f; background: #f7f7f8; }
        .design-switcher button.active { border-color: #10a37f; background: #10a37f; color: white; }
        .design-container { display: none; }
        .design-container.active { display: block; }
        .sidebar-icon { width: 20px; text-align: center; }
    </style>
</head>
<body>
    <div class="design-switcher">
        <div style="font-weight: 700; margin-bottom: 10px; color: #333;">🎨 Dashboard Designs</div>
        <button onclick="showDesign(1)" class="active" id="btn-1">1️⃣ ChatGPT Classic</button>
        <button onclick="showDesign(2)" id="btn-2">2️⃣ Notion Minimal</button>
        <button onclick="showDesign(3)" id="btn-3">3️⃣ Modern Sidebar</button>
    </div>

    <!-- Design content will be loaded here -->
    <div id="design-1" class="design-container active">
        <div class="flex h-screen bg-gray-50">
            <div class="w-64 bg-gray-900 text-white flex flex-col">
                <div class="p-4 border-b border-gray-700"><h1 class="text-xl font-bold">WorVox</h1></div>
                <div class="p-3">
                    <button class="w-full bg-transparent border border-gray-600 hover:bg-gray-800 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all">
                        <i class="fas fa-plus"></i><span class="font-medium">New Conversation</span>
                    </button>
                </div>
                <nav class="flex-1 p-3 space-y-2 overflow-y-auto">
                    <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-all"><i class="fas fa-comments sidebar-icon"></i><span>AI Conversation</span></a>
                    <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-all"><i class="fas fa-book sidebar-icon"></i><span>Vocabulary</span></a>
                    <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-all"><i class="fas fa-history sidebar-icon"></i><span>History</span></a>
                </nav>
                <div class="p-4 border-t border-gray-700">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-semibold">J</div>
                        <div class="flex-1"><div class="font-medium text-sm">John Doe</div><div class="text-xs text-gray-400">Premium Plan</div></div>
                    </div>
                </div>
            </div>
            <div class="flex-1 flex flex-col">
                <div class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-gray-800">Choose Your Learning Path</h2>
                    <button class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-all"><i class="fas fa-crown mr-2"></i>Upgrade</button>
                </div>
                <div class="flex-1 overflow-y-auto p-8">
                    <div class="max-w-4xl mx-auto">
                        <div class="text-center mb-12"><h1 class="text-4xl font-bold text-gray-900 mb-3">Welcome back, John!</h1><p class="text-gray-600 text-lg">What would you like to learn today?</p></div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-emerald-400 transition-all cursor-pointer">
                                <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4"><i class="fas fa-comments text-2xl text-emerald-600"></i></div>
                                <h3 class="text-xl font-semibold text-gray-900 mb-2">AI Conversation</h3>
                                <p class="text-gray-600 mb-4">Practice real-time English conversations</p>
                                <div class="flex items-center justify-between"><span class="text-sm text-emerald-600 font-medium">Start chatting →</span><span class="text-xs bg-gray-100 px-2 py-1 rounded">Unlimited</span></div>
                            </div>
                            <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer">
                                <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4"><i class="fas fa-book text-2xl text-blue-600"></i></div>
                                <h3 class="text-xl font-semibold text-gray-900 mb-2">Vocabulary</h3>
                                <p class="text-gray-600 mb-4">Learn 678+ words with AI search</p>
                                <div class="flex items-center justify-between"><span class="text-sm text-blue-600 font-medium">Browse words →</span><span class="text-xs bg-gray-100 px-2 py-1 rounded">678 words</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div id="design-2" class="design-container">
        <div class="flex h-screen bg-white">
            <div class="w-60 bg-gray-50 border-r border-gray-200 flex flex-col">
                <div class="p-4">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">W</div>
                        <div><div class="font-semibold text-gray-900 text-sm">WorVox</div><div class="text-xs text-gray-500">John's Workspace</div></div>
                    </div>
                    <input type="text" placeholder="Search..." class="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none">
                </div>
                <nav class="flex-1 px-3 space-y-1">
                    <a href="#" class="flex items-center gap-3 px-3 py-2 rounded-md bg-emerald-100 text-emerald-700 text-sm font-medium"><i class="fas fa-comments sidebar-icon"></i><span>Conversation</span></a>
                    <a href="#" class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-200 text-sm font-medium text-gray-700"><i class="fas fa-book sidebar-icon text-gray-500"></i><span>Vocabulary</span></a>
                </nav>
            </div>
            <div class="flex-1 flex flex-col bg-white">
                <div class="border-b border-gray-200 px-8 py-4"><h1 class="text-2xl font-semibold text-gray-900">Dashboard</h1><p class="text-sm text-gray-500 mt-0.5">Continue your learning journey</p></div>
                <div class="flex-1 overflow-y-auto p-8"><div class="max-w-6xl mx-auto"><h2 class="text-sm font-semibold text-gray-400 uppercase mb-4">Learning Modules</h2></div></div>
            </div>
        </div>
    </div>

    <div id="design-3" class="design-container">
        <div class="flex h-screen bg-gray-50">
            <div class="w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm">
                <div class="p-6 border-b border-gray-100">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">W</div>
                        <div><h1 class="text-xl font-bold text-gray-900">WorVox</h1><p class="text-xs text-gray-500">AI English Learning</p></div>
                    </div>
                </div>
                <div class="p-4">
                    <button class="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-lg flex items-center justify-center gap-2"><i class="fas fa-plus-circle"></i><span>Start Learning</span></button>
                </div>
                <nav class="flex-1 px-4 py-2 space-y-1">
                    <a href="#" class="flex items-center gap-3 px-3 py-3 rounded-xl bg-emerald-50 text-emerald-700 font-medium"><div class="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center"><i class="fas fa-home text-sm"></i></div><span>Dashboard</span></a>
                    <a href="#" class="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 text-gray-700"><div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><i class="fas fa-comments text-sm text-gray-600"></i></div><span>Conversation</span></a>
                </nav>
            </div>
            <div class="flex-1 flex flex-col">
                <div class="bg-white border-b border-gray-200 px-8 py-4"><h1 class="text-xl font-bold text-gray-900">Welcome back, John! 👋</h1></div>
                <div class="flex-1 overflow-y-auto p-8 bg-gray-50"><div class="max-w-7xl mx-auto"><div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"></div></div></div>
            </div>
        </div>
    </div>

    <script>
        function showDesign(num) {
            document.querySelectorAll('.design-container').forEach(d => d.classList.remove('active'));
            document.querySelectorAll('.design-switcher button').forEach(b => b.classList.remove('active'));
            document.getElementById('design-' + num).classList.add('active');
            document.getElementById('btn-' + num).classList.add('active');
        }
    </script>
</body>
</html>`);
});

export default preview;
